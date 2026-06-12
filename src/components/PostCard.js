import Image from "next/image";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function PostCard({ submission }) {
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
    <article className="post-card">
      <div className={frameClassName}>
        {submission.displayImageUrl ? (
          <Image
            src={submission.displayImageUrl}
            alt={submission.line}
            className="post-image"
            fill
            sizes="(max-width: 720px) 100vw, 440px"
          />
        ) : (
          <div className="photo-placeholder" />
        )}
      </div>

      <p className="post-line">{submission.line}</p>

      <div className="post-meta">
        <span>{author}</span>
        <span className="post-category">{submission.categoryName}</span>
        <time dateTime={submission.createdAt}>
          {DATE_FORMATTER.format(new Date(submission.createdAt))}
        </time>
      </div>

      <div className="post-tags" aria-label="mood tags">
        {submission.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    </article>
  );
}
