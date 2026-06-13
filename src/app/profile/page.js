import FoundationPanel from "../../components/FoundationPanel";
import PageIntro from "../../components/PageIntro";
import { requireAuthenticatedUser } from "../../lib/auth";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const { supabase, claims } = await requireAuthenticatedUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, username, role, accepted_terms, created_at")
    .eq("id", claims.sub)
    .maybeSingle();

  const displayName = profile?.display_name || claims.email || "your profile";

  return (
    <main className="page-shell">
      <PageIntro
        eyebrow="private account area"
        title={displayName}
        description="Your account is connected. Submission history and moderation updates will appear here as those systems are built."
      />

      {error ? (
        <p className="auth-message auth-error" role="alert">
          We could not load your profile details. Please try again shortly.
        </p>
      ) : null}

      <div className="panel-grid">
        <FoundationPanel
          title="Account"
          description={`Signed in as ${claims.email}. Your role is ${profile?.role || "user"}.`}
          items={[
            profile?.accepted_terms
              ? "submission terms accepted"
              : "submission terms not accepted yet",
            "email confirmed",
          ]}
        />
        <FoundationPanel
          title="Submission history"
          description="Pending, approved, rejected, appealed, and removal-requested moments will be listed here."
        />
      </div>
    </main>
  );
}
