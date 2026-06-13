import AuthSubmitButton from "../../components/AuthSubmitButton";
import FoundationPanel from "../../components/FoundationPanel";
import Icon from "../../components/Icon";
import PageIntro from "../../components/PageIntro";
import { SUBMISSION_LIMITS } from "../../constants/product";
import { requireAuthenticatedUser } from "../../lib/auth";
import { updateDisplayName } from "../auth/actions";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage({ searchParams }) {
  const params = await searchParams;
  const { supabase, claims } = await requireAuthenticatedUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, username, role, accepted_terms, created_at")
    .eq("id", claims.sub)
    .maybeSingle();

  const displayName = profile?.display_name || claims.email || "your profile";
  const message = typeof params?.message === "string" ? params.message : "";
  const actionError = typeof params?.error === "string" ? params.error : "";

  return (
    <main className="page-shell page-shell-wide profile-page">
      <section className="profile-hero">
        <div className="profile-avatar" aria-hidden="true">
          {(profile?.display_name || claims.email || "?").charAt(0).toUpperCase()}
        </div>
        <PageIntro
          eyebrow="your quiet corner"
          title={displayName}
          description="Your account is connected. Submission history and moderation updates will appear here as those systems are built."
        />
        <div className="profile-state">
          <span className="status-dot" />
          email confirmed
        </div>
      </section>

      {error ? (
        <p className="auth-message auth-error" role="alert">
          We could not load your profile details. Please try again shortly.
        </p>
      ) : null}
      {actionError ? (
        <p className="auth-message auth-error" role="alert">
          {actionError}
        </p>
      ) : null}
      {message ? <p className="auth-message auth-success">{message}</p> : null}

      <div className="profile-overview">
        <article className="profile-stat">
          <span>00</span>
          <p>moments shared</p>
        </article>
        <article className="profile-stat">
          <span>00</span>
          <p>awaiting review</p>
        </article>
        <article className="profile-stat">
          <Icon name="shield" size={24} />
          <p>{profile?.role || "user"} account</p>
        </article>
        <article className="profile-stat profile-stat-wide">
          <p className="eyebrow">signed in as</p>
          <strong>{claims.email}</strong>
        </article>
      </div>

      <div className="profile-columns">
        <section className="account-settings">
          <div>
            <p className="eyebrow">account settings</p>
            <h2>how should we know you?</h2>
            <p>
              This is your default public name. You can still choose initials,
              another name, or anonymity for each future submission.
            </p>
          </div>

          <form className="auth-form account-form" action={updateDisplayName}>
            <div className="auth-field">
              <label htmlFor="displayName">display name</label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                defaultValue={profile?.display_name || ""}
                maxLength={SUBMISSION_LIMITS.displayNameCharacters}
              />
              <small>Leave blank to remove your default display name.</small>
            </div>

            <AuthSubmitButton pendingText="saving...">
              save display name
            </AuthSubmitButton>
          </form>
        </section>

        <FoundationPanel
          eyebrow="soon"
          icon="journal"
          title="your submission history"
          description="Pending, approved, rejected, appealed, and removal-requested moments will be gathered here."
          items={[
            profile?.accepted_terms
              ? "submission terms accepted"
              : "terms will be shown before your first submission",
            "private to your account",
          ]}
        />
      </div>
    </main>
  );
}
