const DEMO_PUBLIC_SUBMISSION_ROWS = [
  {
    id: "1",
    display_image_path: null,
    line: "found the last quiet corner of the library before exams started.",
    display_name: "S.",
    is_anonymous: false,
    category_name: "Quiet Moments",
    category_slug: "quiet-moments",
    frame_slug: "soft-paper",
    frame_css_class: "frame-soft-paper",
    visual_key: "library",
    tags: ["before the storm", "campus"],
    orientation: "landscape",
    is_photo_of_week: true,
    is_category_featured: false,
    created_at: "2026-06-12T14:30:00.000Z",
  },
  {
    id: "2",
    display_image_path: null,
    line: "the exam was tomorrow. i watched the birds instead.",
    display_name: "Nadia",
    is_anonymous: false,
    category_name: "Campus Life",
    category_slug: "campus-life",
    frame_slug: "clean-landscape",
    frame_css_class: "frame-clean-landscape",
    visual_key: "birds",
    tags: ["after the exam", "outside"],
    orientation: "landscape",
    is_photo_of_week: false,
    is_category_featured: true,
    created_at: "2026-06-11T19:00:00.000Z",
  },
  {
    id: "3",
    display_image_path: null,
    line: "the sky looked softer after the rain.",
    display_name: "anonymous",
    is_anonymous: true,
    category_name: "Nature",
    category_slug: "nature",
    frame_slug: "clean-portrait",
    frame_css_class: "frame-clean-portrait",
    visual_key: "rain",
    tags: ["rain", "walking home"],
    orientation: "portrait",
    is_photo_of_week: false,
    is_category_featured: true,
    created_at: "2026-06-10T18:15:00.000Z",
  },
  {
    id: "4",
    display_image_path: null,
    line: "half my thoughts stayed somewhere between class and the bus stop.",
    display_name: "M.",
    is_anonymous: false,
    category_name: "Quiet Moments",
    category_slug: "quiet-moments",
    frame_slug: "clean-square",
    frame_css_class: "frame-clean-square",
    visual_key: "commute",
    tags: ["commute", "in between"],
    orientation: "square",
    is_photo_of_week: false,
    is_category_featured: true,
    created_at: "2026-06-09T21:45:00.000Z",
  },
];

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
    orientation: row.orientation,
    isPhotoOfWeek: row.is_photo_of_week,
    isCategoryFeatured: row.is_category_featured,
    createdAt: row.created_at,
  };
}

export function getApprovedSubmissions() {
  return DEMO_PUBLIC_SUBMISSION_ROWS.map(mapPublicSubmission);
}

export function getPhotoOfWeek(submissions = getApprovedSubmissions()) {
  return (
    submissions.find((submission) => submission.isPhotoOfWeek) ??
    submissions[0] ??
    null
  );
}

export function getFeaturedSubmissions(
  submissions = getApprovedSubmissions(),
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
