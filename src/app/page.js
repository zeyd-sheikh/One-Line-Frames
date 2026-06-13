import Link from "next/link";
import Icon from "../components/Icon";
import MomentGallery from "../components/MomentGallery";
import { ROUTES } from "../constants/routes";
import { getApprovedSubmissions } from "../services/submissions";

export default function HomePage() {
  const submissions = getApprovedSubmissions();

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-ambient hero-ambient-one" />
        <div className="hero-ambient hero-ambient-two" />

        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="kicker-mark">
              <Icon name="sparkle" size={13} />
            </span>
            a student-made gallery at utsc
          </div>

          <h1>
            a place for the moments
            <br />
            <em>between everything else.</em>
          </h1>

          <p>
            One photo. One honest line. No likes, follower counts, comments, or
            pressure to turn your day into content.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#moments">
              wander the wall <Icon name="arrow" size={16} />
            </a>
            <Link className="button button-quiet" href={ROUTES.submit}>
              share a moment
            </Link>
          </div>

          <div className="hero-principles" aria-label="Platform principles">
            <span>human-reviewed</span>
            <span>student-made</span>
            <span>quiet by design</span>
          </div>
        </div>

        <div className="hero-collage" aria-label="A preview of quiet moments">
          <div className="collage-note collage-note-top">
            <span>today, 4:17 pm</span>
            <p>the light stayed after everyone left.</p>
          </div>

          <div className="collage-frame collage-frame-main">
            <div className="moment-art moment-art-sunset" aria-hidden="true">
              <span className="moment-art-sun" />
              <span className="moment-art-horizon" />
              <span className="moment-art-shape moment-art-shape-one" />
              <span className="moment-art-shape moment-art-shape-two" />
              <span className="moment-art-grain" />
            </div>
            <span className="tape tape-top" />
            <span className="collage-caption">somewhere after class</span>
          </div>

          <div className="collage-frame collage-frame-small">
            <div className="moment-art moment-art-rain" aria-hidden="true">
              <span className="moment-art-sun" />
              <span className="moment-art-horizon" />
              <span className="moment-art-shape moment-art-shape-one" />
              <span className="moment-art-shape moment-art-shape-two" />
              <span className="moment-art-grain" />
            </div>
          </div>

          <div className="collage-stamp">
            <Icon name="camera" size={17} />
            <span>notice this</span>
          </div>
        </div>
      </section>

      <section className="quiet-manifesto" aria-label="What makes this different">
        <p className="manifesto-number">01</p>
        <blockquote>
          “not everything meaningful needs to become a performance.”
        </blockquote>
        <p className="manifesto-copy">
          One Line Frames keeps the parts of sharing that feel human and leaves
          the competition behind.
        </p>
      </section>

      <MomentGallery submissions={submissions} />

      <section className="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">made with care</p>
          <h2>simple on purpose.</h2>
        </div>

        <div className="process-grid">
          <article>
            <span className="process-number">01</span>
            <Icon name="camera" size={24} />
            <h3>notice something</h3>
            <p>A small piece of your day is enough. It does not need polish.</p>
          </article>
          <article>
            <span className="process-number">02</span>
            <Icon name="journal" size={24} />
            <h3>give it one line</h3>
            <p>Say what stayed with you, in your own words and your own voice.</p>
          </article>
          <article>
            <span className="process-number">03</span>
            <Icon name="shield" size={24} />
            <h3>we review with care</h3>
            <p>Every submission is checked before joining the public wall.</p>
          </article>
        </div>
      </section>

      <section className="home-cta">
        <div className="cta-orbit cta-orbit-one" />
        <div className="cta-orbit cta-orbit-two" />
        <p className="eyebrow">your turn, when you are ready</p>
        <h2>what did you notice today?</h2>
        <p>It can be ordinary. Those are usually the moments worth keeping.</p>
        <Link className="button button-primary" href={ROUTES.submit}>
          send a moment <Icon name="arrow" size={16} />
        </Link>
      </section>
    </main>
  );
}
