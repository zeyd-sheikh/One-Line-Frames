"use client";

import { useEffect, useRef } from "react";
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
  const cardRef = useRef(null);
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

  useEffect(() => {
    const card = cardRef.current;

    if (!card || layout !== "gallery") {
      card?.style.removeProperty("grid-row-end");
      return undefined;
    }

    const gallery = card.closest(".gallery-gallery");

    if (!gallery) {
      return undefined;
    }

    function updateGridSpan() {
      const galleryStyles = window.getComputedStyle(gallery);
      const rowHeight = Number.parseFloat(galleryStyles.gridAutoRows);
      const rowGap = Number.parseFloat(galleryStyles.rowGap);
      const cardGap =
        Number.parseFloat(
          galleryStyles.getPropertyValue("--gallery-card-gap")
        ) || 0;

      if (!rowHeight) {
        return;
      }

      const cardHeight = card.getBoundingClientRect().height;
      const span = Math.ceil(
        (cardHeight + cardGap + rowGap) / (rowHeight + rowGap)
      );

      card.style.gridRowEnd = `span ${span}`;
    }

    updateGridSpan();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateGridSpan);

    resizeObserver?.observe(card);
    window.addEventListener("resize", updateGridSpan);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateGridSpan);
      card.style.removeProperty("grid-row-end");
    };
  }, [layout]);

  return (
    <article
      ref={cardRef}
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
