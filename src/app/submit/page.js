import FoundationPanel from "../../components/FoundationPanel";
import Icon from "../../components/Icon";
import PageIntro from "../../components/PageIntro";
import { SUBMISSION_LIMITS } from "../../constants/product";
import { requireAuthenticatedUser } from "../../lib/auth";

export const metadata = {
  title: "Send a moment",
};

export default async function SubmitPage() {
  await requireAuthenticatedUser();

  return (
    <main className="page-shell page-shell-wide submit-page">
      <div className="submit-heading-row">
        <PageIntro
          eyebrow="submission workspace"
          title="send a moment"
          description="One photo, one short line, and a few choices about how your moment should appear. Submissions will be reviewed before publishing."
        />
        <div className="submit-promise">
          <Icon name="shield" size={18} />
          <span>private until approved</span>
        </div>
      </div>

      <div className="submit-preview-layout">
        <section className="submit-preview-card">
          <div className="preview-step">
            <span>01</span>
            <div>
              <p>your photo</p>
              <small>JPG, PNG, WebP, HEIC or HEIF · up to 25 MB</small>
            </div>
          </div>
          <div className="preview-upload">
            <Icon name="camera" size={28} />
            <p>photo upload coming next</p>
            <span>the original image will stay private during review</span>
          </div>

          <div className="preview-step">
            <span>02</span>
            <div>
              <p>your one line</p>
              <small>up to {SUBMISSION_LIMITS.lineCharacters} characters</small>
            </div>
          </div>
          <div className="preview-line">
            the ordinary thing that stayed with you...
          </div>

          <div className="preview-fields">
            <div>
              <span>03</span>
              <p>category</p>
              <small>choose one</small>
            </div>
            <div>
              <span>04</span>
              <p>mood tags</p>
              <small>add a few</small>
            </div>
            <div>
              <span>05</span>
              <p>credit</p>
              <small>name, initials, or anonymous</small>
            </div>
          </div>
        </section>

        <aside className="submit-sidebar">
          <FoundationPanel
            eyebrow="almost ready"
            icon="sparkle"
            title="the form is being prepared"
            description="Uploads are intentionally disabled while storage rules and moderation tools are completed."
            items={[
              "every new post starts pending",
              "the photo itself cannot be replaced",
              "you choose how your name appears",
              "you can request removal later",
            ]}
          />

          <div className="submit-tip">
            <span>nothing polished required</span>
            <p>
              A bus window, a half-finished coffee, an empty hallway. Small is
              welcome here.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
