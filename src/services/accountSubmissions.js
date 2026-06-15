import "server-only";

import { STORAGE_BUCKETS } from "../constants/database";
import { buildAdminChangeEvents } from "../lib/adminChangeHistory";

function createSignedUrlMap(items = []) {
  return new Map(
    items
      .filter((item) => item.path && item.signedUrl)
      .map((item) => [item.path, item.signedUrl])
  );
}

export async function getAccountSubmissions(supabase) {
  const { data, error } = await supabase
    .from("submissions")
    .select(
      [
        "id",
        "original_image_path",
        "display_image_path",
        "image_width",
        "image_height",
        "orientation",
        "one_line",
        "edited_one_line",
        "status",
        "display_name_snapshot",
        "is_anonymous",
        "category_id",
        "created_at",
        "approved_at",
        "rejected_at",
      ].join(",")
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { submissions: [], error };
  }

  const rows = data ?? [];
  const submissionIds = rows.map((submission) => submission.id);
  const originalPaths = [
    ...new Set(
      rows
        .filter((submission) => submission.status !== "approved")
        .map((submission) => submission.original_image_path)
        .filter(Boolean)
    ),
  ];
  const displayPaths = [
    ...new Set(
      rows
        .filter((submission) => submission.status === "approved")
        .map((submission) => submission.display_image_path)
        .filter(Boolean)
    ),
  ];

  const [
    { data: categories },
    { data: frames },
    { data: tagLinks },
    { data: tags },
    { data: adminEdits },
    { data: removalRequests },
    originalImages,
    displayImages,
  ] = await Promise.all([
    supabase.from("categories").select("id, name, slug"),
    supabase.from("frames").select("id, name"),
    submissionIds.length
      ? supabase
          .from("submission_tags")
          .select("submission_id, tag_id")
          .in("submission_id", submissionIds)
      : Promise.resolve({ data: [] }),
    supabase.from("tags").select("id, name"),
    submissionIds.length
      ? supabase
          .from("admin_edits")
          .select(
            "id, submission_id, admin_id, changed_field, old_value, new_value, reason, created_at"
          )
          .in("submission_id", submissionIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    submissionIds.length
      ? supabase
          .from("removal_requests")
          .select(
            "id, submission_id, reason, status, admin_response, created_at, reviewed_at"
          )
          .in("submission_id", submissionIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    originalPaths.length
      ? supabase.storage
          .from(STORAGE_BUCKETS.originalImages)
          .createSignedUrls(originalPaths, 60 * 60)
      : Promise.resolve({ data: [] }),
    displayPaths.length
      ? supabase.storage
          .from(STORAGE_BUCKETS.displayImages)
          .createSignedUrls(displayPaths, 60 * 60)
      : Promise.resolve({ data: [] }),
  ]);

  const categoryById = new Map(
    (categories ?? []).map((category) => [category.id, category])
  );
  const categoryNameById = new Map(
    (categories ?? []).map((category) => [category.id, category.name])
  );
  const frameNameById = new Map(
    (frames ?? []).map((frame) => [frame.id, frame.name])
  );
  const tagById = new Map((tags ?? []).map((tag) => [tag.id, tag.name]));
  const tagsBySubmission = new Map();
  const latestRemovalBySubmission = new Map();
  const adminChangesBySubmission = buildAdminChangeEvents(adminEdits ?? [], {
    categoryById: categoryNameById,
    frameById: frameNameById,
  });

  (tagLinks ?? []).forEach((link) => {
    const tagName = tagById.get(link.tag_id);

    if (!tagName) {
      return;
    }

    const currentTags = tagsBySubmission.get(link.submission_id) ?? [];
    currentTags.push(tagName);
    tagsBySubmission.set(link.submission_id, currentTags);
  });

  (removalRequests ?? []).forEach((request) => {
    if (!latestRemovalBySubmission.has(request.submission_id)) {
      latestRemovalBySubmission.set(request.submission_id, request);
    }
  });

  const originalUrlByPath = createSignedUrlMap(originalImages.data ?? []);
  const displayUrlByPath = createSignedUrlMap(displayImages.data ?? []);

  return {
    error: null,
    submissions: rows.map((submission) => {
      const category = categoryById.get(submission.category_id);
      const isPublished = submission.status === "approved";
      const imagePath = isPublished
        ? submission.display_image_path
        : submission.original_image_path;

      return {
        id: submission.id,
        imageUrl: isPublished
          ? displayUrlByPath.get(imagePath) ?? null
          : originalUrlByPath.get(imagePath) ?? null,
        imageWidth: submission.image_width,
        imageHeight: submission.image_height,
        orientation: submission.orientation,
        line: submission.edited_one_line || submission.one_line,
        status: submission.status,
        displayName: submission.display_name_snapshot,
        isAnonymous: submission.is_anonymous,
        categoryName: category?.name ?? "Uncategorized",
        categorySlug: category?.slug ?? "",
        tags: tagsBySubmission.get(submission.id) ?? [],
        adminChanges: adminChangesBySubmission.get(submission.id) ?? [],
        removalRequest:
          latestRemovalBySubmission.get(submission.id) ?? null,
        createdAt: submission.created_at,
        approvedAt: submission.approved_at,
        rejectedAt: submission.rejected_at,
      };
    }),
  };
}
