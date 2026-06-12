import FoundationPanel from "../../components/FoundationPanel";
import PageIntro from "../../components/PageIntro";

export const metadata = {
  title: "Send a moment",
};

export default function SubmitPage() {
  return (
    <main className="page-shell">
      <PageIntro
        eyebrow="submission workspace"
        title="send a moment"
        description="One photo, one short line, and a few choices about how your moment should appear. Submissions will be reviewed before publishing."
      />

      <FoundationPanel
        title="The form is being prepared"
        description="Uploads are intentionally disabled during the foundation phase. The finished flow will require a verified account and save every new submission as pending."
        items={[
          "upload one original photo",
          "write a short caption",
          "choose a category and mood tags",
          "use a profile name, initials, or post anonymously",
          "accept the submission terms",
        ]}
      />
    </main>
  );
}
