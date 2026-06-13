import Icon from "./Icon";
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
        <div className={frameClassName}>
          <MomentVisual submission={submission} priority={index < 2} />
          <span className="frame-corner frame-corner-one" />
          <span className="frame-corner frame-corner-two" />
          <span className="moment-view-cue">
            open moment <Icon name="arrow" size={14} />
          </span>
        </div>
      </button>

      <div className="post-copy">
        <p className="post-line">{submission.line}</p>

        <div className="post-meta">
          <span>{author}</span>
          <span className="meta-dot" aria-hidden="true" />
          <span>{submission.categoryName}</span>
          <span className="meta-dot" aria-hidden="true" />
          <time dateTime={submission.createdAt}>
            {DATE_FORMATTER.format(new Date(submission.createdAt))}
          </time>
        </div>

        <div className="post-tags" aria-label="mood tags">
          {submission.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
