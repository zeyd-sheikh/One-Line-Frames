"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DATABASE_FUNCTIONS,
  STORAGE_BUCKETS,
} from "../../constants/database";
import { SUBMISSION_LIMITS } from "../../constants/product";
import { ROUTES } from "../../constants/routes";
import { requireAdminUser } from "../../lib/auth";

function readText(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithMessage(key, message) {
  redirect(`${ROUTES.admin}?${key}=${encodeURIComponent(message)}`);
}

function parseTags(value) {
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, " "))
        .filter(Boolean)
    ),
  ].sort();
}

function arraysMatch(first, second) {
  return (
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  );
}

function revalidatePublicationPaths() {
  revalidatePath(ROUTES.admin);
  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.profileSubmissions);
  revalidatePath(ROUTES.gallery);
  revalidatePath(ROUTES.home);
}

async function removeDisplayImage(supabase, displayImagePath) {
  if (!displayImagePath) {
    return null;
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.displayImages)
    .remove([displayImagePath]);

  return error;
}

export async function reviewSubmission(formData) {
  const { supabase } = await requireAdminUser({ verified: true });

  const submissionId = readText(formData, "submissionId");
  const decision = readText(formData, "decision");
  const oneLine = readText(formData, "oneLine");
  const displayNameSnapshot = readText(formData, "displayNameSnapshot");
  const categoryId = readText(formData, "categoryId");
  const frameId = readText(formData, "frameId");
  const reason = readText(formData, "reason");
  const tags = parseTags(readText(formData, "tags"));
  const isAnonymous = formData.get("isAnonymous") === "on";
  let displayImagePath = null;

  if (
    !submissionId ||
    !["publish", "publish_edits", "reject"].includes(decision)
  ) {
    redirectWithMessage("error", "Choose a valid moderation action.");
  }

  if (reason.length > SUBMISSION_LIMITS.editReasonCharacters) {
    redirectWithMessage(
      "error",
      `Keep the moderation note under ${SUBMISSION_LIMITS.editReasonCharacters} characters.`
    );
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select(
      "id, user_id, original_image_path, image_mime_type, one_line, edited_one_line, display_name_snapshot, is_anonymous, category_id, frame_id, status"
    )
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError || !submission) {
    redirectWithMessage("error", "The submission could not be loaded.");
  }

  if (submission.status !== "pending") {
    redirectWithMessage(
      "error",
      "This submission has already left the pending review queue."
    );
  }

  const { data: currentTagLinks } = await supabase
    .from("submission_tags")
    .select("tag_id")
    .eq("submission_id", submissionId);
  const currentTagIds = (currentTagLinks ?? []).map((link) => link.tag_id);
  const { data: currentTagRows } = currentTagIds.length
    ? await supabase
        .from("tags")
        .select("name")
        .in("id", currentTagIds)
    : { data: [] };
  const currentTags = (currentTagRows ?? [])
    .map((tag) => tag.name)
    .sort();
  const currentLine = submission.edited_one_line || submission.one_line;
  const currentDisplayName = submission.display_name_snapshot ?? "";
  const currentFrameId = submission.frame_id ?? "";
  const metadataChanged =
    oneLine !== currentLine ||
    displayNameSnapshot !== currentDisplayName ||
    isAnonymous !== submission.is_anonymous ||
    categoryId !== submission.category_id ||
    frameId !== currentFrameId ||
    !arraysMatch(tags, currentTags);

  if (decision === "publish" && metadataChanged) {
    redirectWithMessage(
      "error",
      "Edits were detected. Choose Publish with edits and add a note, or restore the original values."
    );
  }

  if (decision === "publish_edits" && !metadataChanged) {
    redirectWithMessage(
      "error",
      "No edits were detected. Choose Publish instead."
    );
  }

  if (
    ["publish_edits", "reject"].includes(decision) &&
    !reason
  ) {
    redirectWithMessage(
      "error",
      decision === "reject"
        ? "Add a rejection reason for the submission owner."
        : "Explain the edits for the submission owner."
    );
  }

  const preservesOriginal = decision === "publish" || decision === "reject";
  const reviewedLine = preservesOriginal ? currentLine : oneLine;
  const reviewedDisplayName = preservesOriginal
    ? currentDisplayName
    : displayNameSnapshot;
  const reviewedIsAnonymous = preservesOriginal
    ? submission.is_anonymous
    : isAnonymous;
  const reviewedCategoryId = preservesOriginal
    ? submission.category_id
    : categoryId;
  const reviewedFrameId = preservesOriginal ? currentFrameId : frameId;
  const reviewedTags = preservesOriginal ? currentTags : tags;

  if (
    !reviewedLine ||
    reviewedLine.length > SUBMISSION_LIMITS.lineCharacters
  ) {
    redirectWithMessage(
      "error",
      `The line must be between 1 and ${SUBMISSION_LIMITS.lineCharacters} characters.`
    );
  }

  if (!reviewedCategoryId) {
    redirectWithMessage("error", "Choose a category.");
  }

  if (
    !reviewedIsAnonymous &&
    (!reviewedDisplayName ||
      reviewedDisplayName.length > SUBMISSION_LIMITS.displayNameCharacters)
  ) {
    redirectWithMessage(
      "error",
      "Named posts need a public display name."
    );
  }

  if (
    reviewedTags.length > SUBMISSION_LIMITS.tagCount ||
    reviewedTags.some(
      (tag) => tag.length > SUBMISSION_LIMITS.tagCharacters
    )
  ) {
    redirectWithMessage(
      "error",
      `Use no more than ${SUBMISSION_LIMITS.tagCount} tags, each ${SUBMISSION_LIMITS.tagCharacters} characters or less.`
    );
  }

  if (decision !== "reject") {
    const displayExtensions = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const extension = displayExtensions[submission.image_mime_type];

    if (!extension) {
      redirectWithMessage(
        "error",
        "HEIC and HEIF conversion is not enabled yet. Keep this submission pending until the image-processing phase."
      );
    }

    const { data: originalImage, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKETS.originalImages)
      .download(submission.original_image_path);

    if (downloadError || !originalImage) {
      redirectWithMessage(
        "error",
        "The private original could not be prepared for publication."
      );
    }

    displayImagePath = `${submission.user_id}/${submission.id}.${extension}`;
    const { error: displayUploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.displayImages)
      .upload(displayImagePath, originalImage, {
        cacheControl: "3600",
        contentType: submission.image_mime_type,
        upsert: true,
      });

    if (displayUploadError) {
      redirectWithMessage(
        "error",
        "The public display copy could not be created."
      );
    }
  }

  const { error } = await supabase.rpc(DATABASE_FUNCTIONS.reviewSubmission, {
    p_submission_id: submissionId,
    p_decision: decision === "reject" ? "reject" : "approve",
    p_one_line: reviewedLine,
    p_display_name_snapshot: reviewedDisplayName || null,
    p_is_anonymous: reviewedIsAnonymous,
    p_category_id: reviewedCategoryId,
    p_frame_id: reviewedFrameId || null,
    p_tags: reviewedTags,
    p_display_image_path: displayImagePath,
    p_reason:
      decision === "publish"
        ? "Published without metadata edits."
        : reason,
  });

  if (error) {
    if (displayImagePath) {
      await supabase.storage
        .from(STORAGE_BUCKETS.displayImages)
        .remove([displayImagePath]);
    }

    redirectWithMessage(
      "error",
      error.message || "The moderation action could not be saved."
    );
  }

  revalidatePublicationPaths();

  const messages = {
    publish: "Submission published without metadata edits.",
    publish_edits: "Edited submission published with an audit note.",
    reject: "Submission rejected and the reason is visible to its owner.",
  };

  redirectWithMessage("message", messages[decision]);
}

export async function reviewRemovalRequest(formData) {
  const requestId = readText(formData, "requestId");
  const decision = readText(formData, "decision");
  const response = readText(formData, "response");

  if (!requestId || !["accept", "reject"].includes(decision)) {
    redirectWithMessage("error", "Choose a valid removal-request decision.");
  }

  if (
    !response ||
    response.length > SUBMISSION_LIMITS.editReasonCharacters
  ) {
    redirectWithMessage(
      "error",
      `Provide a response between 1 and ${SUBMISSION_LIMITS.editReasonCharacters} characters.`
    );
  }

  const { supabase } = await requireAdminUser({ verified: true });
  const { data: displayImagePath, error } = await supabase.rpc(
    DATABASE_FUNCTIONS.reviewRemovalRequest,
    {
      p_request_id: requestId,
      p_decision: decision,
      p_response: response,
    }
  );

  if (error) {
    redirectWithMessage(
      "error",
      error.message || "The removal request could not be reviewed."
    );
  }

  const cleanupError =
    decision === "accept"
      ? await removeDisplayImage(supabase, displayImagePath)
      : null;

  revalidatePublicationPaths();

  if (cleanupError) {
    redirectWithMessage(
      "message",
      "The post was removed from the gallery, but its display-file cleanup needs another attempt."
    );
  }

  redirectWithMessage(
    "message",
    decision === "accept"
      ? "Removal request accepted and the post was removed."
      : "Removal request declined and the owner can see the response."
  );
}

export async function removePublishedSubmission(formData) {
  const submissionId = readText(formData, "submissionId");
  const reason = readText(formData, "reason");

  if (!submissionId) {
    redirectWithMessage("error", "Choose a published submission.");
  }

  if (
    !reason ||
    reason.length > SUBMISSION_LIMITS.editReasonCharacters
  ) {
    redirectWithMessage(
      "error",
      `Provide a removal reason between 1 and ${SUBMISSION_LIMITS.editReasonCharacters} characters.`
    );
  }

  const { supabase } = await requireAdminUser({ verified: true });
  const { data: displayImagePath, error } = await supabase.rpc(
    DATABASE_FUNCTIONS.removePublishedSubmission,
    {
      p_submission_id: submissionId,
      p_reason: reason,
    }
  );

  if (error) {
    redirectWithMessage(
      "error",
      error.message || "The published submission could not be removed."
    );
  }

  const cleanupError = await removeDisplayImage(supabase, displayImagePath);
  revalidatePublicationPaths();

  redirectWithMessage(
    "message",
    cleanupError
      ? "The post was removed from the gallery, but its display-file cleanup needs another attempt."
      : "The published post was removed and recorded in the audit history."
  );
}

export async function updatePublicationHighlight(formData) {
  const submissionId = readText(formData, "submissionId");
  const highlight = readText(formData, "highlight");
  const enabled = readText(formData, "enabled") === "true";

  if (
    !submissionId ||
    !["featured", "photo_of_week"].includes(highlight)
  ) {
    redirectWithMessage("error", "Choose a valid publication highlight.");
  }

  const { supabase } = await requireAdminUser({ verified: true });
  const { error } = await supabase.rpc(
    DATABASE_FUNCTIONS.setSubmissionHighlight,
    {
      p_submission_id: submissionId,
      p_highlight: highlight,
      p_enabled: enabled,
    }
  );

  if (error) {
    redirectWithMessage(
      "error",
      error.message || "The publication highlight could not be updated."
    );
  }

  revalidatePublicationPaths();

  const message =
    highlight === "photo_of_week"
      ? enabled
        ? "Photo of the week updated."
        : "Photo of the week cleared."
      : enabled
        ? "Photo added to featured moments."
        : "Photo removed from featured moments.";

  redirectWithMessage("message", message);
}
