import "server-only";
import {
  DATABASE_FUNCTIONS,
  STORAGE_BUCKETS,
} from "../constants/database";
import { createClient } from "../lib/supabase/server";

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
  limit = 3
) {
  const photoOfWeek = getPhotoOfWeek(submissions);
  const candidates = submissions.filter(
    (submission) => submission.id !== photoOfWeek?.id
  );
  const featured = candidates.filter(
    (submission) => submission.isCategoryFeatured
  );
  const fallback = candidates.filter(
    (submission) => !submission.isCategoryFeatured
  );

  return [...featured, ...fallback].slice(0, limit);
}

export function getSubmissionTags(submissions) {
  const tags = submissions.flatMap((submission) => submission.tags);
  return ["all", ...new Set(tags)];
}
