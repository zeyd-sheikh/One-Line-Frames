const MOCK_SUBMISSIONS = [
  {
    id: "1",
    imageUrl: null,
    line: "found the last quiet corner of the library before exams started.",
    authorName: "S.",
    tag: "before the storm",
    createdAt: "28m ago",
    orientation: "landscape",
    status: "approved",
  },
  {
    id: "2",
    imageUrl: null,
    line: "the exam was tomorrow. i watched the birds instead.",
    authorName: "Nadia",
    tag: "after the exam",
    createdAt: "7h ago",
    orientation: "landscape",
    status: "approved",
  },
  {
    id: "3",
    imageUrl: null,
    line: "the sky looked softer after the rain.",
    authorName: "anonymous",
    tag: "walking home",
    createdAt: "1d ago",
    orientation: "landscape",
    status: "approved",
  },
  {
    id: "4",
    imageUrl: null,
    line: "half my thoughts stayed somewhere between class and the bus stop.",
    authorName: "M.",
    tag: "in between",
    createdAt: "2d ago",
    orientation: "landscape",
    status: "approved",
  },
];

export function getApprovedSubmissions() {
  return MOCK_SUBMISSIONS.filter((submission) => {
    return submission.status === "approved";
  });
}

export function getSubmissionTags(submissions) {
  const tags = submissions.map((submission) => submission.tag);
  return ["all", ...new Set(tags)];
}