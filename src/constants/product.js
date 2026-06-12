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
  removalRequested: "removal_requested",
  removed: "removed",
});

export const USER_ROLE = Object.freeze({
  user: "user",
  admin: "admin",
});
