import Link from "next/link";
import { ROUTES } from "../constants/routes";
import Icon from "./Icon";
import MomentVisual from "./MomentVisual";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function getAuthor(submission) {
  return submission.isAnonymous
    ? "anonymous"
    : submission.displayName || "anonymous";
}

export default function HomeHighlights({ photoOfWeek, featured }) {
  if (!photoOfWeek) {
    return null;
  }

  return (
    <>
      <section className="home-week" id="featured" data-reveal>
        <div className="week-heading">
          <div>
            <p className="eyebrow">photo of the week</p>
            <h2>one moment, held a little longer.</h2>
          </div>
          <span className="week-index">no. 01</span>
        </div>

        <div className="week-layout">
          <Link
            className={`week-frame ${photoOfWeek.orientation}`}
            href={ROUTES.gallery}
            aria-label={`View the gallery, starting with: ${photoOfWeek.line}`}
          >
            <MomentVisual submission={photoOfWeek} priority />
            <span className="week-frame-edge" aria-hidden="true" />
            <span className="week-open-cue">
              enter the gallery <Icon name="arrow" size={15} />
            </span>
          </Link>

          <div className="week-copy">
            <div className="week-category">
              <Icon name="sparkle" size={14} />
              <span>{photoOfWeek.categoryName}</span>
            </div>
            <blockquote>&ldquo;{photoOfWeek.line}&rdquo;</blockquote>
            <div className="week-byline">
              <span>by {getAuthor(photoOfWeek)}</span>
              <time dateTime={photoOfWeek.createdAt}>
                {DATE_FORMATTER.format(new Date(photoOfWeek.createdAt))}
              </time>
            </div>
            <div className="post-tags">
              {photoOfWeek.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
            <p className="week-note">
              Chosen by the One Line Frames team for the way it notices
              something ordinary without asking it to be more.
            </p>
          </div>
        </div>
      </section>

      <section className="home-featured" data-reveal>
        <div className="featured-heading">
          <div>
            <p className="eyebrow">selected from the wall</p>
            <h2>featured moments.</h2>
          </div>
          <Link href={ROUTES.gallery}>
            explore every moment <Icon name="arrow" size={15} />
          </Link>
        </div>

        <div className="featured-grid">
          {featured.map((submission, index) => (
            <Link
              key={submission.id}
              className="featured-card"
              href={ROUTES.gallery}
              style={{ "--feature-index": index }}
            >
              <div
                className={`featured-visual ${submission.orientation} ${submission.frameCssClass || ""}`}
              >
                <MomentVisual submission={submission} />
                <span className="featured-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="featured-copy">
                <p>{submission.line}</p>
                <span>
                  {getAuthor(submission)} · {submission.categoryName}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
