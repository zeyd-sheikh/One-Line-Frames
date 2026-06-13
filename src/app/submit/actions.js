"use server";

import { revalidatePath } from "next/cache";
import { DATABASE_FUNCTIONS, STORAGE_BUCKETS } from "../../constants/database";
import {
  IMAGE_ORIENTATION,
  SUBMISSION_LIMITS,
  SUPPORTED_IMAGE_MIME_TYPES,
} from "../../constants/product";
import { ROUTES } from "../../constants/routes";
import { requireAuthenticatedUser } from "../../lib/auth";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readText(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

function parsePositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
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

function getInitials(displayName) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part.charAt(0).toUpperCase())
    .join(".");
}

async function removeOrphanUpload(supabase, userId, imagePath) {
  if (!imagePath.startsWith(`${userId}/`)) {
    return;
  }

  await supabase.storage.from(STORAGE_BUCKETS.originalImages).remove([imagePath]);
}

export async function createSubmission(formData) {
  const { supabase, claims } = await requireAuthenticatedUser();
  const originalImagePath = readText(formData, "originalImagePath");

  async function fail(message) {
    if (originalImagePath) {
      await removeOrphanUpload(supabase, claims.sub, originalImagePath);
    }

    return { ok: false, error: message };
  }

  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user?.email_confirmed_at) {
    return fail("Confirm your email before submitting a moment.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, accepted_terms")
    .eq("id", claims.sub)
    .maybeSingle();

  if (profileError || !profile) {
    return fail("We could not load your profile. Please try again.");
  }

  const line = readText(formData, "line");
  const categoryId = readText(formData, "categoryId");
  const orientation = readText(formData, "orientation");
  const originalFilename = readText(formData, "originalFilename");
  const imageMimeType = readText(formData, "imageMimeType");
  const imageSizeBytes = parsePositiveInteger(
    readText(formData, "imageSizeBytes")
  );
  const imageWidth = parsePositiveInteger(readText(formData, "imageWidth"));
  const imageHeight = parsePositiveInteger(readText(formData, "imageHeight"));
  const creditMode = readText(formData, "creditMode");
  const customDisplayName = readText(formData, "customDisplayName");
  const acceptedTerms =
    profile.accepted_terms || readText(formData, "acceptTerms") === "true";
  const tags = parseTags(readText(formData, "tags"));

  if (
    !originalImagePath ||
    !originalImagePath.startsWith(`${claims.sub}/`)
  ) {
    return fail("Upload a photo before submitting.");
  }

  if (!SUPPORTED_IMAGE_MIME_TYPES.includes(imageMimeType)) {
    return fail("Choose a JPEG, PNG, WebP, HEIC, or HEIF image.");
  }

  if (!imageSizeBytes || imageSizeBytes > SUBMISSION_LIMITS.imageBytes) {
    return fail("The image must be no larger than 25 MB.");
  }

  if (!line || line.length > SUBMISSION_LIMITS.lineCharacters) {
    return fail(
      `Your line must be between 1 and ${SUBMISSION_LIMITS.lineCharacters} characters.`
    );
  }

  if (!UUID_PATTERN.test(categoryId)) {
    return fail("Choose a category.");
  }

  if (!Object.values(IMAGE_ORIENTATION).includes(orientation)) {
    return fail("Choose the image orientation.");
  }

  if (tags.length > SUBMISSION_LIMITS.tagCount) {
    return fail(`Use no more than ${SUBMISSION_LIMITS.tagCount} mood tags.`);
  }

  if (tags.some((tag) => tag.length > SUBMISSION_LIMITS.tagCharacters)) {
    return fail(
      `Each mood tag must be ${SUBMISSION_LIMITS.tagCharacters} characters or less.`
    );
  }

  if (!acceptedTerms) {
    return fail("Accept the submission terms before continuing.");
  }

  let displayNameSnapshot = null;
  let isAnonymous = false;

  if (creditMode === "anonymous") {
    isAnonymous = true;
  } else if (creditMode === "profile") {
    displayNameSnapshot = profile.display_name?.trim() || null;
  } else if (creditMode === "initials") {
    displayNameSnapshot = profile.display_name
      ? getInitials(profile.display_name)
      : null;
  } else if (creditMode === "custom") {
    displayNameSnapshot = customDisplayName;
  } else {
    return fail("Choose how your name should appear.");
  }

  if (
    !isAnonymous &&
    (!displayNameSnapshot ||
      displayNameSnapshot.length > SUBMISSION_LIMITS.displayNameCharacters)
  ) {
    return fail(
      creditMode === "profile" || creditMode === "initials"
        ? "Add a profile display name, choose a custom name, or post anonymously."
        : `Public names must be between 1 and ${SUBMISSION_LIMITS.displayNameCharacters} characters.`
    );
  }

  const { data: submissionId, error } = await supabase.rpc(
    DATABASE_FUNCTIONS.createSubmission,
    {
      p_original_image_path: originalImagePath,
      p_original_filename: originalFilename,
      p_image_mime_type: imageMimeType,
      p_image_size_bytes: imageSizeBytes,
      p_image_width: imageWidth,
      p_image_height: imageHeight,
      p_orientation: orientation,
      p_one_line: line,
      p_display_name_snapshot: displayNameSnapshot,
      p_is_anonymous: isAnonymous,
      p_category_id: categoryId,
      p_tags: tags,
      p_accept_terms: acceptedTerms,
    }
  );

  if (error) {
    return fail(error.message || "We could not save your submission.");
  }

  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.admin);

  return { ok: true, submissionId };
}
