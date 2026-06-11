export default function PostCard({ submission }) {
  const author = submission.authorName || "anonymous";

  return (
    <article className="post-card">
      <div className={`photo-frame ${submission.orientation}`}>
        {submission.imageUrl ? (
          <img
            src={submission.imageUrl}
            alt={submission.line}
            className="post-image"
          />
        ) : (
          <div className="photo-placeholder" />
        )}
      </div>

      <p className="post-line">{submission.line}</p>

      <div className="post-meta">
        <span>{author}</span>
        <span className="post-tag">{submission.tag}</span>
        <span>{submission.createdAt}</span>
      </div>
    </article>
  );
}