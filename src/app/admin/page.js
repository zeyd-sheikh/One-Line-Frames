import FoundationPanel from "../../components/FoundationPanel";
import PageIntro from "../../components/PageIntro";

export const metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <main className="page-shell page-shell-wide">
      <PageIntro
        eyebrow="restricted moderation area"
        title="admin workspace"
        description="Authorized moderators will use this private workspace. Every action must remain attributable to the person who performed it."
      />

      <div className="panel-grid panel-grid-three">
        <FoundationPanel
          title="Review queue"
          description="Review pending submissions, inspect the original image, and approve or reject publication."
        />
        <FoundationPanel
          title="Editable details"
          description="Admins may change captions, categories, tags, frames, and moderation reasons, but never replace the uploaded photo."
        />
        <FoundationPanel
          title="Audit history"
          description="Every edit and decision will record the admin, reason, old value, new value, and timestamp."
        />
      </div>

      <FoundationPanel
        title="Later moderation workflows"
        description="This area will also handle one-time rejection appeals, removal requests, category and frame management, and featured content."
      />
    </main>
  );
}
