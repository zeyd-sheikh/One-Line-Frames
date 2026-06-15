import Image from "next/image";
import Link from "next/link";
import AdminChangeHistory from "../../../components/AdminChangeHistory";
import Icon from "../../../components/Icon";
import PageIntro from "../../../components/PageIntro";
import RemovalRequestForm from "../../../components/RemovalRequestForm";
import { ROUTES } from "../../../constants/routes";
import { requireAuthenticatedUser } from "../../../lib/auth";
import { getImageFrameStyle } from "../../../lib/imagePresentation";
import { getAccountSubmissions } from "../../../services/accountSubmissions";

export const metadata = {
  title: "Your submissions",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const VIEWS = {
  progress: {
    label: "in review",
    title: "moments in review.",
    description:
      "Pending and rejected submissions stay private while you follow their review status and admin notes.",
  },
  published: {
    label: "published",
    title: "published moments.",
    description:
      "Approved moments currently appearing in the public One Line Frames gallery.",
  },
  all: {
    label: "all",
    title: "all your moments.",
    description:
      "Your complete submission history, from private review to publication.",
  },
};

function belongsToView(submission, view) {
  if (view === "progress") {
    return ["pending", "rejected"].includes(submission.status);
  }

  if (view === "published") {
    return submission.status === "approved";
  }

  return true;
}

export default async function ProfileSubmissionsPage({ searchParams }) {
  const params = await searchParams;
  const requestedView =
    typeof params?.view === "string" ? params.view : "progress";
  const view = VIEWS[requestedView] ? requestedView : "progress";
  const { supabase } = await requireAuthenticatedUser();
  const { submissions, error } = await getAccountSubmissions(supabase);
  const filteredSubmissions = submissions.filter((submission) =>
    belongsToView(submission, view)
  );
  const counts = {
    progress: submissions.filter((submission) =>
      ["pending", "rejected"].includes(submission.status)
    ).length,
    published: submissions.filter(
      (submission) => submission.status === "approved"
    ).length,
    all: submissions.length,
  };
  const message = typeof params?.message === "string" ? params.message : "";
  const actionError = typeof params?.error === "string" ? params.error : "";

  return (
    <main className="page-shell page-shell-wide submissions-history-page">
      <Link className="profile-back-link" href={ROUTES.profile}>
        <Icon name="arrow" size={14} />
        back to profile
      </Link>

      <PageIntro
        eyebrow="your submission archive"
        title={VIEWS[view].title}
        description={VIEWS[view].description}
      />

      <nav className="submission-view-tabs" aria-label="Submission history">
        {Object.entries(VIEWS).map(([key, item]) => (
          <Link
            key={key}
            href={`${ROUTES.profileSubmissions}?view=${key}`}
            className={view === key ? "is-active" : ""}
          >
            {item.label}
            <span>{counts[key]}</span>
          </Link>
        ))}
      </nav>

      {actionError ? (
        <p className="auth-message auth-error" role="alert">
          {actionError}
        </p>
      ) : null}
      {message ? <p className="auth-message auth-success">{message}</p> : null}

      {error ? (
        <p className="auth-message auth-error" role="alert">
          Your submission history could not be loaded.
        </p>
      ) : null}

      {filteredSubmissions.length ? (
        <section className="account-submission-list">
          {filteredSubmissions.map((submission) => (
            <article className="account-submission-card" key={submission.id}>
              <div
                className={`account-submission-image ${submission.orientation}`}
                style={getImageFrameStyle(submission)}
              >
                {submission.imageUrl ? (
                  <Image
                    src={submission.imageUrl}
                    alt={submission.line}
                    fill
                    sizes="(max-width: 760px) 100vw, 340px"
                    unoptimized
                  />
                ) : (
                  <div className="account-submission-image-empty">
                    <Icon name="camera" size={25} />
                    <span>private preview unavailable</span>
                  </div>
                )}
              </div>

              <div className="account-submission-copy">
                <div className="account-submission-meta">
                  <span className={`history-status ${submission.status}`}>
                    {submission.status}
                  </span>
                  <span>{submission.categoryName}</span>
                  <time dateTime={submission.createdAt}>
                    {DATE_FORMATTER.format(new Date(submission.createdAt))}
                  </time>
                </div>

                <h2>{submission.line}</h2>
                <p className="account-submission-credit">
                  {submission.isAnonymous
                    ? "posted anonymously"
                    : `credited as ${submission.displayName || "unnamed"}`}
                </p>

                {submission.tags.length ? (
                  <div className="account-submission-tags">
                    {submission.tags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                ) : null}

                <AdminChangeHistory events={submission.adminChanges} />

                {submission.status === "approved" ? (
                  <div className="account-submission-footer">
                    <Link
                      className="account-submission-action"
                      href={ROUTES.gallery}
                    >
                      view public gallery <Icon name="arrow" size={14} />
                    </Link>
                    {submission.removalRequest?.status === "pending" ? (
                      <div className="removal-request-state pending">
                        <strong>removal requested</strong>
                        <span>waiting for admin review</span>
                      </div>
                    ) : (
                      <RemovalRequestForm submissionId={submission.id} />
                    )}
                    {submission.removalRequest?.status === "rejected" ? (
                      <div className="removal-request-response">
                        <strong>previous request declined</strong>
                        <span>
                          {submission.removalRequest.admin_response}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="account-submission-state">
                    {submission.status === "pending"
                      ? "This moment is private and waiting for admin review."
                      : submission.status === "removed"
                        ? "This moment has been removed from the public gallery."
                        : "This moment remains private and is not in the gallery."}
                  </p>
                )}
                {submission.status === "removed" &&
                submission.removalRequest?.admin_response ? (
                  <div className="removal-request-response accepted">
                    <strong>removal completed</strong>
                    <span>{submission.removalRequest.admin_response}</span>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="submissions-history-empty">
          <Icon name={view === "published" ? "camera" : "journal"} size={26} />
          <h2>
            {view === "published"
              ? "nothing published yet."
              : "nothing waiting here."}
          </h2>
          <p>
            {view === "published"
              ? "Approved moments will collect here and appear in the gallery."
              : "New submissions and review decisions will appear here."}
          </p>
          <Link href={ROUTES.submit}>send a moment</Link>
        </section>
      )}
    </main>
  );
}
