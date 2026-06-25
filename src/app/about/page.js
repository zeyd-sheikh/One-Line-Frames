import PageIntro from "../../components/PageIntro";
import Icon from "../../components/Icon";
import Link from "next/link";
import { ROUTES } from "../../constants/routes";
import { PRODUCT, SUPPORT_LINKS } from "../../constants/product";

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

      <section className="founders-section">
        <div className="founders-heading">
          <div>
            <p className="eyebrow">behind the frames</p>
            <h2>made by three students noticing with care.</h2>
          </div>
          <p>
            One Line Frames is being shaped by co-founders Uzair, Zeyd, and
            Mustafa. Portraits and fuller notes will live here once the team
            page is ready.
          </p>
        </div>

        <div className="founders-grid">
          {[
            {
              name: "Uzair",
              role: "co-founder",
              note: "A small quote or about line will sit here.",
            },
            {
              name: "Zeyd",
              role: "co-founder",
              note: "A small quote or about line will sit here.",
            },
            {
              name: "Mustafa",
              role: "co-founder",
              note: "A small quote or about line will sit here.",
            },
          ].map((founder) => (
            <article key={founder.name} className="founder-card">
              <div className="founder-portrait" aria-hidden="true">
                <Icon name="user" size={30} />
              </div>
              <div>
                <p>{founder.role}</p>
                <h3>{founder.name}</h3>
                <blockquote>&ldquo;{founder.note}&rdquo;</blockquote>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-card about-contact" id="contact">
        <div className="contact-card-icon">
          <Icon name="mail" size={24} />
        </div>
        <div>
          <p className="eyebrow">main inbox</p>
          <h2>{PRODUCT.contactEmail}</h2>
          <p>
            Questions, removal concerns, moderation questions, quiet feedback,
            or anything broken can all start here.
          </p>
          <a
            className="button button-primary"
            href={`mailto:${PRODUCT.contactEmail}`}
          >
            email the team <Icon name="arrow" size={16} />
          </a>
        </div>
      </section>

      <section className="contact-support about-support">
        <p className="eyebrow">support links</p>
        <h2>if it feels heavy, get backup.</h2>
        <div className="contact-support-links">
          {SUPPORT_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
              <Icon name="arrow" size={14} />
            </a>
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
