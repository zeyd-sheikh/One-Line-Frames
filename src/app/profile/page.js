import AuthSubmitButton from "../../components/AuthSubmitButton";
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
  const [
    { data: profile, error },
    { data: submissions, error: submissionsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, role, accepted_terms, created_at")
      .eq("id", claims.sub)
      .maybeSingle(),
    supabase
      .from("submissions")
      .select(
        "id, one_line, edited_one_line, status, rejection_reason, display_name_snapshot, is_anonymous, created_at"
      )
      .order("created_at", { ascending: false }),
  ]);

  const submissionIds = (submissions ?? []).map((submission) => submission.id);
  const { data: adminEdits } = submissionIds.length
    ? await supabase
        .from("admin_edits")
        .select("submission_id, reason, created_at")
        .in("submission_id", submissionIds)
        .order("created_at", { ascending: false })
    : { data: [] };
  const latestEditReason = new Map();

  (adminEdits ?? []).forEach((edit) => {
    if (!latestEditReason.has(edit.submission_id)) {
      latestEditReason.set(edit.submission_id, edit.reason);
    }
  });

  const displayName = profile?.display_name || claims.email || "your profile";
  const moments = submissions ?? [];
  const pendingCount = moments.filter(
    (submission) => submission.status === "pending"
  ).length;
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
          description="Follow each submitted moment from private review to its final decision, including any notes left by the admin team."
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
      {submissionsError ? (
        <p className="auth-message auth-error" role="alert">
          We could not load your submission history.
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
          <span>{String(moments.length).padStart(2, "0")}</span>
          <p>moments submitted</p>
        </article>
        <article className="profile-stat">
          <span>{String(pendingCount).padStart(2, "0")}</span>
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

        <section className="profile-history">
          <div className="profile-history-heading">
            <p className="eyebrow">your submissions</p>
            <h2>moments in progress.</h2>
          </div>

          {moments.length ? (
            <div className="profile-history-list">
              {moments.map((submission) => {
                const moderationReason =
                  submission.rejection_reason ||
                  latestEditReason.get(submission.id);

                return (
                  <article key={submission.id}>
                    <div className="history-status-row">
                      <span className={`history-status ${submission.status}`}>
                        {submission.status}
                      </span>
                      <time dateTime={submission.created_at}>
                        {new Intl.DateTimeFormat("en-CA", {
                          month: "short",
                          day: "numeric",
                        }).format(new Date(submission.created_at))}
                      </time>
                    </div>
                    <p>
                      {submission.edited_one_line || submission.one_line}
                    </p>
                    <small>
                      {submission.is_anonymous
                        ? "anonymous"
                        : submission.display_name_snapshot || "named post"}
                    </small>
                    {moderationReason ? (
                      <div className="history-reason">
                        <strong>admin note</strong>
                        <span>{moderationReason}</span>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="profile-history-empty">
              <Icon name="journal" size={22} />
              <p>Your first submitted moment will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
