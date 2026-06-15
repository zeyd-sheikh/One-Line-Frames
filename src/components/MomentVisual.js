import Image from "next/image";

export default function MomentVisual({
  submission,
  priority = false,
  sizes = "(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 460px",
  unoptimized = false,
}) {
  if (submission.displayImageUrl) {
    return (
      <Image
        src={submission.displayImageUrl}
        alt={submission.line}
        className="post-image"
        fill
        priority={priority}
        sizes={sizes}
        unoptimized={unoptimized}
      />
    );
  }

  return (
    <div
      className={`moment-art moment-art-${submission.visualKey || "quiet"}`}
      aria-hidden="true"
    >
      <span className="moment-art-sun" />
      <span className="moment-art-horizon" />
      <span className="moment-art-shape moment-art-shape-one" />
      <span className="moment-art-shape moment-art-shape-two" />
      <span className="moment-art-grain" />
    </div>
  );
}
