const DEMO_SUBMISSIONS = [
  {
    id: "1",
    imageUrl: null,
    line: "found the last quiet corner of the library before exams started.",
    displayName: "S.",
    isAnonymous: false,
    category: "quiet moments",
    tags: ["before the storm", "campus"],
    createdAt: "28m ago",
    orientation: "landscape",
    status: "approved",
  },
  {
    id: "2",
    imageUrl: null,
    line: "the exam was tomorrow. i watched the birds instead.",
    displayName: "Nadia",
    isAnonymous: false,
    category: "campus life",
    tags: ["after the exam", "outside"],
    createdAt: "7h ago",
    orientation: "landscape",
    status: "approved",
  },
  {
    id: "3",
    imageUrl: null,
    line: "the sky looked softer after the rain.",
    displayName: null,
    isAnonymous: true,
    category: "nature",
    tags: ["walking home", "rain"],
    createdAt: "1d ago",
    orientation: "landscape",
    status: "approved",
  },
  {
    id: "4",
    imageUrl: null,
    line: "half my thoughts stayed somewhere between class and the bus stop.",
    displayName: "M.",
    isAnonymous: false,
    category: "quiet moments",
    tags: ["in between", "commute"],
    createdAt: "2d ago",
    orientation: "landscape",
    status: "approved",
  },
];

export function getApprovedSubmissions() {
  return DEMO_SUBMISSIONS.filter((submission) => {
    return submission.status === "approved";
  });
}

export function getSubmissionTags(submissions) {
  const tags = submissions.flatMap((submission) => submission.tags);
  return ["all", ...new Set(tags)];
}
