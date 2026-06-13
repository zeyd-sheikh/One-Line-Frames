export const PRODUCT = Object.freeze({
  name: "One Line Frames",
  shortName: "one line frames.",
  description:
    "A quiet, student-focused place to share one photo and one short line.",
  location: "UTSC, Toronto, Canada",
  contactEmail: "onelineframes123@gmail.com",
});

export const SUPPORT_LINKS = Object.freeze([
  { href: "https://kidshelpphone.ca/", label: "kids help phone" },
  { href: "https://good2talk.ca/", label: "good2talk" },
  { href: "https://988.ca/", label: "crisis services canada" },
]);

export const SUBMISSION_STATUS = Object.freeze({
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  removed: "removed",
});

export const REVIEW_STATUS = Object.freeze({
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
});

export const USER_ROLE = Object.freeze({
  user: "user",
  admin: "admin",
});

export const IMAGE_ORIENTATION = Object.freeze({
  landscape: "landscape",
  portrait: "portrait",
  square: "square",
});

export const FRAME_ORIENTATION = Object.freeze({
  ...IMAGE_ORIENTATION,
  any: "any",
});

export const SUBMISSION_LIMITS = Object.freeze({
  lineCharacters: 120,
  displayNameCharacters: 80,
  imageBytes: 26_214_400,
  tagCount: 5,
  tagCharacters: 30,
  editReasonCharacters: 1_000,
  appealCharacters: 2_000,
  removalReasonCharacters: 2_000,
});

export const SUPPORTED_IMAGE_MIME_TYPES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
