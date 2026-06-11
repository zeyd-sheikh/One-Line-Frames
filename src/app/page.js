"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useMemo, useState } from "react";
import Link from "next/link";
import Gallery from "../components/Gallery";
import {
  getApprovedSubmissions,
  getSubmissionTags,
} from "../services/submissions";

export default function HomePage() {
  const submissions = getApprovedSubmissions();
  const tags = getSubmissionTags(submissions);

  const [activeTag, setActiveTag] = useState("all");

  const filteredSubmissions = useMemo(() => {
    if (activeTag === "all") {
      return submissions;
    }

    return submissions.filter((submission) => {
      return submission.tag === activeTag;
    });
  }, [activeTag, submissions]);

  return (
    <main>
    <Navbar activePage="moments" />

      <section className="hero">
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
        {tags.map((tag) => (
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

    <Footer />
    </main>
  );
}