import Link from "next/link";
import { ROUTES } from "../constants/routes";
import { getImageFrameStyle } from "../lib/imagePresentation";
import Icon from "./Icon";
import MomentVisual from "./MomentVisual";

function getAuthor(submission) {
  return submission.isAnonymous
    ? "anonymous"
    : submission.displayName || "anonymous";
}

export default function HomeHighlights({ photoOfWeek, featured }) {
  if (!photoOfWeek && !featured.length) {
    return null;
  }

  return (
    <>
      {photoOfWeek ? (
        <section className="home-hall" id="featured" data-reveal>
          <div className="hall-copy">
            <p className="eyebrow">hall of fame</p>
            <h2>the best of the best, kept gently.</h2>
            <p>
              Competitions will live here later. For now, this is a quiet
              preview: one standout frame on the front pillar, with room for
              future winners to join it.
            </p>
            <Link className="button button-quiet" href={ROUTES.gallery}>
              visit the full wall <Icon name="arrow" size={16} />
            </Link>
          </div>

          <div className="hall-podium" aria-label="Hall of Fame preview">
            <div className="hall-pillar hall-pillar-side hall-pillar-left">
              <span>future contest</span>
            </div>

            <Link
              className={`hall-pillar hall-pillar-main ${photoOfWeek.orientation}`}
              href={ROUTES.gallery}
              aria-label={`Open the Hall of Fame moment: ${photoOfWeek.line}`}
              style={getImageFrameStyle(photoOfWeek)}
            >
              <span className="hall-badge">
                <Icon name="sparkle" size={13} />
                photo of the week
              </span>
              <div className="hall-photo">
                <MomentVisual submission={photoOfWeek} priority />
              </div>
              <div className="hall-moment-copy">
                <p>{photoOfWeek.categoryName}</p>
                <blockquote>&ldquo;{photoOfWeek.line}&rdquo;</blockquote>
                <span>by {getAuthor(photoOfWeek)}</span>
              </div>
            </Link>

            <div className="hall-pillar hall-pillar-side hall-pillar-right">
              <span>coming soon</span>
            </div>
          </div>
        </section>
      ) : null}

      {featured.length ? (
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
                  style={getImageFrameStyle(submission)}
                >
                  <MomentVisual submission={submission} />
                  <span className="featured-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="featured-copy">
                  <p>{submission.line}</p>
                  <span>
                    {getAuthor(submission)} / {submission.categoryName}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
