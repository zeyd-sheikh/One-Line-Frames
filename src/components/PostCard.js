"use client";

import Icon from "./Icon";
import { getImageFrameStyle } from "../lib/imagePresentation";
import MomentVisual from "./MomentVisual";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function PostCard({
  submission,
  index = 0,
  onOpen,
  layout = "gallery",
}) {
  const author = submission.isAnonymous
    ? "anonymous"
    : submission.displayName || "anonymous";
  const frameClassName = [
    "photo-frame",
    submission.orientation,
    submission.frameCssClass,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <article
      className={`post-card post-card-${layout}`}
      style={{ "--card-index": index }}
    >
      <button
        type="button"
        className="moment-open"
        onClick={() => onOpen?.(submission)}
        aria-label={`Open moment: ${submission.line}`}
      >
        <div className={frameClassName} style={getImageFrameStyle(submission)}>
          <MomentVisual submission={submission} priority={index < 2} />
          <span className="frame-corner frame-corner-one" />
          <span className="frame-corner frame-corner-two" />
          {submission.isPhotoOfWeek || submission.isCategoryFeatured ? (
            <span className="moment-highlight">
              <Icon name="sparkle" size={12} />
              {submission.isPhotoOfWeek ? "photo of the week" : "featured"}
            </span>
          ) : null}
          <span className="moment-view-cue">
            open moment <Icon name="arrow" size={14} />
          </span>
        </div>
      </button>

      <div className="post-copy">
        <div className="post-kicker">
          <span>{submission.categoryName}</span>
          <time dateTime={submission.createdAt}>
            {DATE_FORMATTER.format(new Date(submission.createdAt))}
          </time>
        </div>

        <p className="post-line">{submission.line}</p>

        <div className="post-detail-row">
          <span className="post-author">by {author}</span>
          <span className="post-index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {submission.tags.length ? (
          <div className="post-tags" aria-label="mood tags">
            {submission.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
