import Icon from "../../components/Icon";
import PageIntro from "../../components/PageIntro";
import { PRODUCT, SUPPORT_LINKS } from "../../constants/product";

export const metadata = {
  title: "Contact",
  description: "Contact the One Line Frames team.",
};

export default function ContactPage() {
  return (
    <main className="page-shell contact-page">
      <PageIntro
        eyebrow="contact"
        title="talk to a real person."
        description="Questions, removal concerns, moderation questions, or quiet feedback can all start here."
      />

      <section className="contact-card">
        <div className="contact-card-icon">
          <Icon name="mail" size={24} />
        </div>
        <div>
          <p className="eyebrow">main inbox</p>
          <h2>{PRODUCT.contactEmail}</h2>
          <p>
            Send a message if something is broken, a post needs attention, or
            you want to ask about the project.
          </p>
          <a className="button button-primary" href={`mailto:${PRODUCT.contactEmail}`}>
            email the team <Icon name="arrow" size={16} />
          </a>
        </div>
      </section>

      <section className="contact-support">
        <p className="eyebrow">support links</p>
        <h2>if it feels heavy, get backup.</h2>
        <div className="contact-support-links">
          {SUPPORT_LINKS.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
              <Icon name="arrow" size={14} />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
