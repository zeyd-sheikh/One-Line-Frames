import PageIntro from "../../components/PageIntro";
import { PRODUCT } from "../../constants/product";

export const metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="page-shell page-shell-narrow">
      <PageIntro
        eyebrow="policy draft"
        title="privacy and photo care"
        description="The final legal terms are still being prepared. This page records the product principles that the eventual policy must protect."
      />

      <div className="prose-stack">
        <section>
          <h2>Your photo remains yours</h2>
          <p>
            Submitting a photo will grant One Line Frames permission to display
            it, not ownership of the image.
          </p>
        </section>
        <section>
          <h2>Anonymous means publicly anonymous</h2>
          <p>
            Anonymous submissions remain privately connected to their account
            so the owner and moderators can manage them.
          </p>
        </section>
        <section>
          <h2>Removal is available</h2>
          <p>
            Account holders will be able to request removal of their own
            submissions. The detailed review and retention rules remain open.
          </p>
        </section>
      </div>

      <p className="policy-draft-note">
        Until the formal policy is approved, questions can be sent to{" "}
        <a href={`mailto:${PRODUCT.contactEmail}`}>{PRODUCT.contactEmail}</a>.
      </p>
    </main>
  );
}
