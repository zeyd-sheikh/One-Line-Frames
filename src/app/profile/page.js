import FoundationPanel from "../../components/FoundationPanel";
import PageIntro from "../../components/PageIntro";

export const metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <main className="page-shell">
      <PageIntro
        eyebrow="private account area"
        title="your moments"
        description="This will be the private home for a user's profile, submissions, moderation updates, appeals, and removal requests."
      />

      <div className="panel-grid">
        <FoundationPanel
          title="Profile"
          description="A default display name will be stored here. Each submission may use that name, initials, an override, or remain anonymous publicly."
        />
        <FoundationPanel
          title="Submission history"
          description="Users will see pending, approved, rejected, appealed, and removal-requested moments without seeing anyone else's private records."
        />
      </div>
    </main>
  );
}
