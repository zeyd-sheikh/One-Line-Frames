"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Gallery from "../components/Gallery";
import {
  getApprovedSubmissions,
  getSubmissionTags,
} from "../services/submissions";

const approvedSubmissions = getApprovedSubmissions();
const submissionTags = getSubmissionTags(approvedSubmissions);

export default function HomePage() {
  const [activeTag, setActiveTag] = useState("all");

  const filteredSubmissions = useMemo(() => {
    if (activeTag === "all") {
      return approvedSubmissions;
    }

    return approvedSubmissions.filter((submission) => {
      return submission.tags.includes(activeTag);
    });
  }, [activeTag]);

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">a student-made gallery</p>
        <h1>
          one photo. one line.
          <br />
          one moment from your day.
        </h1>

        <p>
          a quiet place to notice things.
          <br />
          no likes, no feeds, no noise.
        </p>

        <div className="hero-line" />
      </section>

      <section className="tag-filter" aria-label="filter moments by mood tag">
        {submissionTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={activeTag === tag ? "tag-button active" : "tag-button"}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </section>

      <Gallery submissions={filteredSubmissions} />

      <section className="closing-note">
        <p>
          if you have a moment you&apos;d like to share,{" "}
          <Link href="/submit">we&apos;d love to see it.</Link>
        </p>

        <p>
          if something you see here is bothering you, or if you&apos;re going
          through something heavy, you don&apos;t have to be alone with it.
        </p>
      </section>
    </main>
  );
}
