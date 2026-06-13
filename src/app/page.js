import Link from "next/link";
import HomeHighlights from "../components/HomeHighlights";
import HomeMotion from "../components/HomeMotion";
import Icon from "../components/Icon";
import { ROUTES } from "../constants/routes";
import {
  getApprovedSubmissions,
  getFeaturedSubmissions,
  getPhotoOfWeek,
} from "../services/submissions";

export default function HomePage() {
  const submissions = getApprovedSubmissions();
  const photoOfWeek = getPhotoOfWeek(submissions);
  const featured = getFeaturedSubmissions(submissions);

  return (
    <main className="home-page">
      <HomeMotion />

      <section className="home-hero-stage">
        <div className="hero-wood-grain" aria-hidden="true" />
        <div className="hero-lamp-glow" aria-hidden="true" />

        <div className="home-hero">
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
              One photo. One honest line. No likes, follower counts, comments,
              or pressure to turn your day into content.
            </p>

            <div className="hero-actions">
              <Link className="button button-primary" href={ROUTES.gallery}>
                enter the gallery <Icon name="arrow" size={16} />
              </Link>
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
        </div>

        <a className="hero-scroll-cue" href="#begin">
          <span>step inside</span>
          <i aria-hidden="true" />
        </a>
      </section>

      <section
        className="quiet-manifesto"
        id="begin"
        aria-label="What makes this different"
        data-reveal
      >
        <p className="manifesto-number">01</p>
        <blockquote>
          &ldquo;not everything meaningful needs to become a
          performance.&rdquo;
        </blockquote>
        <p className="manifesto-copy">
          One Line Frames keeps the parts of sharing that feel human and leaves
          the competition behind.
        </p>
      </section>

      <HomeHighlights photoOfWeek={photoOfWeek} featured={featured} />

      <section className="how-it-works" data-reveal>
        <div className="section-heading">
          <p className="eyebrow">made with care</p>
          <h2>simple on purpose.</h2>
        </div>

        <div className="process-grid">
          <article style={{ "--reveal-delay": "0ms" }}>
            <span className="process-number">01</span>
            <Icon name="camera" size={24} />
            <h3>notice something</h3>
            <p>A small piece of your day is enough. It does not need polish.</p>
          </article>
          <article style={{ "--reveal-delay": "110ms" }}>
            <span className="process-number">02</span>
            <Icon name="journal" size={24} />
            <h3>give it one line</h3>
            <p>Say what stayed with you, in your own words and your own voice.</p>
          </article>
          <article style={{ "--reveal-delay": "220ms" }}>
            <span className="process-number">03</span>
            <Icon name="shield" size={24} />
            <h3>we review with care</h3>
            <p>Every submission is checked before joining the public wall.</p>
          </article>
        </div>
      </section>

      <section className="home-cta" data-reveal>
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
