export const DATABASE_TABLES = Object.freeze({
  profiles: "profiles",
  categories: "categories",
  frames: "frames",
  submissions: "submissions",
  tags: "tags",
  submissionTags: "submission_tags",
  adminEdits: "admin_edits",
  appeals: "appeals",
  removalRequests: "removal_requests",
});

export const DATABASE_FUNCTIONS = Object.freeze({
  getPublicSubmissions: "get_public_submissions",
  createSubmission: "create_submission",
  reviewSubmission: "review_submission",
  requestSubmissionRemoval: "request_submission_removal",
  reviewRemovalRequest: "review_removal_request",
  removePublishedSubmission: "remove_published_submission",
  setSubmissionHighlight: "set_submission_highlight",
});

export const STORAGE_BUCKETS = Object.freeze({
  originalImages: "original-images",
  displayImages: "display-images",
});
