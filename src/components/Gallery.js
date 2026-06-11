import PostCard from "./PostCard";

export default function Gallery({ submissions }) {
  if (submissions.length === 0) {
    return (
      <section className="gallery-empty">
        <p>no moments found here yet.</p>
      </section>
    );
  }

  return (
    <section className="gallery">
      {submissions.map((submission) => (
        <PostCard key={submission.id} submission={submission} />
      ))}
    </section>
  );
}