import PageIntro from "../../components/PageIntro";
import { PRODUCT } from "../../constants/product";
import Icon from "../../components/Icon";

export const metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="page-shell privacy-page">
      <PageIntro
        eyebrow="policy draft"
        title="privacy and photo care"
        description="The final legal terms are still being prepared. This page records the product principles that the eventual policy must protect."
      />

      <div className="privacy-principles">
        <section className="privacy-card">
          <div className="privacy-card-icon">
            <Icon name="camera" size={21} />
          </div>
          <h2>Your photo remains yours</h2>
          <p>
            Submitting a photo will grant One Line Frames permission to display
            it, not ownership of the image.
          </p>
        </section>
        <section className="privacy-card">
          <div className="privacy-card-icon">
            <Icon name="user" size={21} />
          </div>
          <h2>Anonymous means publicly anonymous</h2>
          <p>
            Anonymous submissions remain privately connected to their account
            so the owner and moderators can manage them.
          </p>
        </section>
        <section className="privacy-card">
          <div className="privacy-card-icon">
            <Icon name="shield" size={21} />
          </div>
          <h2>Removal is available</h2>
          <p>
            Account holders can request removal of their own approved
            submissions. An admin reviews the request and records a response
            before the post is removed from the public gallery.
          </p>
        </section>
      </div>

      <section className="privacy-contact">
        <Icon name="mail" size={24} />
        <div>
          <p className="eyebrow">questions or concerns</p>
          <h2>talk to a real person.</h2>
          <p>
            Until the formal policy is approved, questions can be sent to{" "}
            <a href={`mailto:${PRODUCT.contactEmail}`}>
              {PRODUCT.contactEmail}
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
