import Image from "next/image";

export default function PostCard({ submission }) {
  const author = submission.isAnonymous
    ? "anonymous"
    : submission.displayName || "anonymous";

  return (
    <article className="post-card">
      <div className={`photo-frame ${submission.orientation}`}>
        {submission.imageUrl ? (
          <Image
            src={submission.imageUrl}
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
        <span className="post-category">{submission.category}</span>
        <span>{submission.createdAt}</span>
      </div>

      <div className="post-tags" aria-label="mood tags">
        {submission.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    </article>
  );
}
