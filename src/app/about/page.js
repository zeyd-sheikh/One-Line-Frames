import PageIntro from "../../components/PageIntro";
import Icon from "../../components/Icon";
import Link from "next/link";
import { ROUTES } from "../../constants/routes";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className="page-shell page-shell-wide about-page">
      <PageIntro
        eyebrow="why this exists"
        title="a quieter way to share"
        description="One Line Frames is a student-focused gallery for ordinary moments that deserve a little attention, without asking them to compete."
      />

      <section className="about-manifesto">
        <p className="manifesto-index">our small belief</p>
        <blockquote>
          The photo does not have to be perfect.
          <br />
          The line does not have to be profound.
          <br />
          <em>You only have to mean it.</em>
        </blockquote>
      </section>

      <div className="prose-grid about-pillars">
        <section className="about-pillar">
          <span>01</span>
          <Icon name="camera" size={24} />
          <h2>one photo.</h2>
          <p>
            A library corner, a late bus, rain on campus, or anything else that
            felt worth keeping.
          </p>
        </section>
        <section className="about-pillar">
          <span>02</span>
          <Icon name="journal" size={24} />
          <h2>one line.</h2>
          <p>
            A short reflection in the student&apos;s own voice, without the
            pressure to perform for a feed.
          </p>
        </section>
        <section className="about-pillar">
          <span>03</span>
          <Icon name="shield" size={24} />
          <h2>held with care.</h2>
          <p>
            Every submission is moderated before it becomes public. There are
            no likes, follower counts, or public comments.
          </p>
        </section>
      </div>

      <section className="not-this">
        <div className="not-this-copy">
          <p className="eyebrow">what we leave out</p>
          <h2>less noise makes room for more noticing.</h2>
        </div>
        <div className="not-this-list">
          {[
            "no like counts",
            "no follower counts",
            "no public comments",
            "no algorithmic ranking",
            "no pressure to post often",
            "no need to be impressive",
          ].map((item) => (
            <div key={item}>
              <Icon name="close" size={14} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <p className="eyebrow">the wall is open</p>
        <h2>bring one honest thing.</h2>
        <Link className="button button-primary" href={ROUTES.submit}>
          share your moment <Icon name="arrow" size={16} />
        </Link>
      </section>
    </main>
  );
}
