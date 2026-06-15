import Image from "next/image";
import Link from "next/link";
import AuthSubmitButton from "../../components/AuthSubmitButton";
import Icon from "../../components/Icon";
import PageIntro from "../../components/PageIntro";
import { SUBMISSION_LIMITS } from "../../constants/product";
import { ROUTES } from "../../constants/routes";
import { requireAuthenticatedUser } from "../../lib/auth";
import { getImageFrameStyle } from "../../lib/imagePresentation";
import { getAccountSubmissions } from "../../services/accountSubmissions";
import { updateDisplayName } from "../auth/actions";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage({ searchParams }) {
  const params = await searchParams;
  const { supabase, claims } = await requireAuthenticatedUser();
  const [
    { data: profile, error },
    { submissions, error: submissionsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, role, accepted_terms, created_at")
      .eq("id", claims.sub)
      .maybeSingle(),
    getAccountSubmissions(supabase),
  ]);

  const displayName = profile?.display_name || claims.email || "your profile";
  const moments = submissions;
  const progressMoments = moments.filter((submission) =>
    ["pending", "rejected"].includes(submission.status)
  );
  const publishedMoments = moments.filter(
    (submission) => submission.status === "approved"
  );
  const pendingCount = progressMoments.filter(
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

      {profile?.role === "admin" ? (
        <section className="profile-admin-entry">
          <div className="profile-admin-entry-icon">
            <Icon name="shield" size={23} />
          </div>
          <div>
            <p className="eyebrow">admin account</p>
            <h2>moderation workspace.</h2>
            <p>
              Review private submissions and record approval or rejection
              decisions. Your password is required before entry.
            </p>
          </div>
          <Link href={ROUTES.adminVerify}>
            verify and enter <Icon name="arrow" size={14} />
          </Link>
        </section>
      ) : null}

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
            <div>
              <p className="eyebrow">your submissions</p>
              <h2>moments in review.</h2>
            </div>
            <Link href={`${ROUTES.profileSubmissions}?view=progress`}>
              view all <Icon name="arrow" size={13} />
            </Link>
          </div>

          {progressMoments.length ? (
            <div className="profile-history-list">
              {progressMoments.slice(0, 3).map((submission) => (
                <article key={submission.id}>
                  <div className="history-status-row">
                    <span className={`history-status ${submission.status}`}>
                      {submission.status}
                    </span>
                    <time dateTime={submission.createdAt}>
                      {new Intl.DateTimeFormat("en-CA", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(submission.createdAt))}
                    </time>
                  </div>
                  <p>{submission.line}</p>
                  <small>
                    {submission.isAnonymous
                      ? "anonymous"
                      : submission.displayName || "named post"}
                  </small>
                  {submission.adminReason ? (
                    <div className="history-reason">
                      <strong>admin note</strong>
                      <span>{submission.adminReason}</span>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="profile-history-empty">
              <Icon name="journal" size={22} />
              <p>Your first submitted moment will appear here.</p>
            </div>
          )}
        </section>
      </div>

      <section className="profile-published">
        <div className="profile-published-heading">
          <div>
            <p className="eyebrow">approved and public</p>
            <h2>published moments.</h2>
          </div>
          <Link href={`${ROUTES.profileSubmissions}?view=published`}>
            view all published <Icon name="arrow" size={14} />
          </Link>
        </div>

        {publishedMoments.length ? (
          <div className="profile-published-grid">
            {publishedMoments.slice(0, 3).map((submission) => (
              <article key={submission.id}>
                <div
                  className={`profile-published-image ${submission.orientation}`}
                  style={getImageFrameStyle(submission)}
                >
                  {submission.imageUrl ? (
                    <Image
                      src={submission.imageUrl}
                      alt={submission.line}
                      fill
                      sizes="(max-width: 720px) 100vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div>
                      <Icon name="camera" size={22} />
                      <span>preview unavailable</span>
                    </div>
                  )}
                </div>
                <div className="profile-published-copy">
                  <span>{submission.categoryName}</span>
                  <h3>{submission.line}</h3>
                  <Link href={ROUTES.gallery}>
                    view in gallery <Icon name="arrow" size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-published-empty">
            <Icon name="camera" size={24} />
            <p>Approved moments will appear here and in the public gallery.</p>
          </div>
        )}
      </section>
    </main>
  );
}
