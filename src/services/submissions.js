import "server-only";
import {
  DATABASE_FUNCTIONS,
  STORAGE_BUCKETS,
} from "../constants/database";
import { createClient } from "../lib/supabase/server";

const FEATURED_LIMIT = 3;

function getDailySeed() {
  return new Date().toISOString().slice(0, 10);
}

function getStableHash(value) {
  let hash = 2166136261;
  const text = String(value);

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getStableRandomOrder(submissions, seed = getDailySeed()) {
  return [...submissions].sort((first, second) => {
    const firstScore = getStableHash(`${seed}:${first.id}`);
    const secondScore = getStableHash(`${seed}:${second.id}`);

    if (firstScore !== secondScore) {
      return firstScore - secondScore;
    }

    return String(first.id).localeCompare(String(second.id));
  });
}

export function mapPublicSubmission(row) {
  return {
    id: row.id,
    displayImagePath: row.display_image_path,
    displayImageUrl: row.display_image_url ?? null,
    line: row.line,
    displayName: row.display_name,
    isAnonymous: row.is_anonymous,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    frameSlug: row.frame_slug,
    frameCssClass: row.frame_css_class,
    visualKey: row.visual_key ?? row.category_slug,
    tags: row.tags ?? [],
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    orientation: row.orientation,
    isPhotoOfWeek: row.is_photo_of_week,
    isCategoryFeatured: row.is_category_featured,
    createdAt: row.created_at,
  };
}

export async function getApprovedSubmissions() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    DATABASE_FUNCTIONS.getPublicSubmissions
  );

  if (error) {
    return {
      submissions: [],
      error,
    };
  }

  if (!data?.length) {
    return {
      submissions: [],
      error: null,
    };
  }

  const displayPaths = [
    ...new Set(
      data
        .map((submission) => submission.display_image_path)
        .filter(Boolean)
    ),
  ];
  const { data: signedImages } = displayPaths.length
    ? await supabase.storage
        .from(STORAGE_BUCKETS.displayImages)
        .createSignedUrls(displayPaths, 60 * 60)
    : { data: [] };
  const signedUrlByPath = new Map(
    (signedImages ?? [])
      .filter((image) => image.path && image.signedUrl)
      .map((image) => [image.path, image.signedUrl])
  );

  return {
    error: null,
    submissions: data.map((submission) =>
      mapPublicSubmission({
        ...submission,
        display_image_url:
          signedUrlByPath.get(submission.display_image_path) ?? null,
      })
    ),
  };
}

export function getPhotoOfWeek(submissions = []) {
  return (
    submissions.find((submission) => submission.isPhotoOfWeek) ??
    submissions[0] ??
    null
  );
}

export function getFeaturedSubmissions(
  submissions = [],
  limit = FEATURED_LIMIT
) {
  const safeLimit = Math.max(0, Math.min(FEATURED_LIMIT, limit));

  if (!safeLimit || !submissions.length) {
    return [];
  }

  const selected = new Map();
  const manuallyFeatured = submissions
    .filter((submission) => submission.isCategoryFeatured)
    .slice(0, safeLimit);

  manuallyFeatured.forEach((submission) => {
    selected.set(submission.id, submission);
  });

  if (selected.size < safeLimit) {
    const fallback = getStableRandomOrder(
      submissions.filter((submission) => !selected.has(submission.id))
    );

    fallback.some((submission) => {
      selected.set(submission.id, submission);
      return selected.size >= safeLimit;
    });
  }

  return [...selected.values()];
}

export function getSubmissionTags(submissions) {
  const tags = submissions.flatMap((submission) => submission.tags);
  return ["all", ...new Set(tags)];
}
