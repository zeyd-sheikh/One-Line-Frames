"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DATABASE_FUNCTIONS,
  STORAGE_BUCKETS,
} from "../../constants/database";
import { SUBMISSION_LIMITS } from "../../constants/product";
import { ROUTES } from "../../constants/routes";
import { requireAuthenticatedUser } from "../../lib/auth";

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
  ];
}

export async function reviewSubmission(formData) {
  const { supabase, claims } = await requireAuthenticatedUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirectWithMessage("error", "Admin access is required.");
  }

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

  if (!submissionId || !["save", "approve", "reject"].includes(decision)) {
    redirectWithMessage("error", "Choose a valid moderation action.");
  }

  if (!reason || reason.length > SUBMISSION_LIMITS.editReasonCharacters) {
    redirectWithMessage(
      "error",
      `Provide a reason between 1 and ${SUBMISSION_LIMITS.editReasonCharacters} characters.`
    );
  }

  if (!oneLine || oneLine.length > SUBMISSION_LIMITS.lineCharacters) {
    redirectWithMessage(
      "error",
      `The line must be between 1 and ${SUBMISSION_LIMITS.lineCharacters} characters.`
    );
  }

  if (!categoryId) {
    redirectWithMessage("error", "Choose a category.");
  }

  if (
    !isAnonymous &&
    (!displayNameSnapshot ||
      displayNameSnapshot.length > SUBMISSION_LIMITS.displayNameCharacters)
  ) {
    redirectWithMessage(
      "error",
      "Named posts need a public display name."
    );
  }

  if (
    tags.length > SUBMISSION_LIMITS.tagCount ||
    tags.some((tag) => tag.length > SUBMISSION_LIMITS.tagCharacters)
  ) {
    redirectWithMessage(
      "error",
      `Use no more than ${SUBMISSION_LIMITS.tagCount} tags, each ${SUBMISSION_LIMITS.tagCharacters} characters or less.`
    );
  }

  if (decision === "approve") {
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, user_id, original_image_path, image_mime_type")
      .eq("id", submissionId)
      .maybeSingle();

    if (submissionError || !submission) {
      redirectWithMessage("error", "The submission could not be loaded.");
    }

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
    p_decision: decision,
    p_one_line: oneLine,
    p_display_name_snapshot: displayNameSnapshot || null,
    p_is_anonymous: isAnonymous,
    p_category_id: categoryId,
    p_frame_id: frameId || null,
    p_tags: tags,
    p_display_image_path: displayImagePath,
    p_reason: reason,
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

  revalidatePath(ROUTES.admin);
  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.gallery);
  revalidatePath(ROUTES.home);

  const messages = {
    save: "Submission metadata saved with an audit record.",
    approve: "Submission approved for the public gallery.",
    reject: "Submission rejected and the reason is visible to its owner.",
  };

  redirectWithMessage("message", messages[decision]);
}
