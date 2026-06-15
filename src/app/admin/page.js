import Image from "next/image";
import AdminChangeHistory from "../../components/AdminChangeHistory";
import Icon from "../../components/Icon";
import ModerationSubmitButtons from "../../components/ModerationSubmitButtons";
import PageIntro from "../../components/PageIntro";
import RemovalDecisionButtons from "../../components/RemovalDecisionButtons";
import { STORAGE_BUCKETS } from "../../constants/database";
import { SUBMISSION_LIMITS } from "../../constants/product";
import { requireAdminUser } from "../../lib/auth";
import { getImageFrameStyle } from "../../lib/imagePresentation";
import { buildAdminChangeEvents } from "../../lib/adminChangeHistory";
import {
  removePublishedSubmission,
  reviewRemovalRequest,
  reviewSubmission,
  updatePublicationHighlight,
} from "./actions";

export const metadata = {
  title: "Admin",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function getTagsBySubmission(tagLinks, tags) {
  const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]));
  const result = new Map();

  tagLinks.forEach((link) => {
    const name = tagNames.get(link.tag_id);

    if (!name) {
      return;
    }

    const current = result.get(link.submission_id) ?? [];
    current.push(name);
    result.set(link.submission_id, current);
  });

  return result;
}

export default async function AdminPage({ searchParams }) {
  const params = await searchParams;
  const { supabase } = await requireAdminUser({ verified: true });

  const [
    { data: pendingSubmissions, error: queueError },
    { data: categories },
    { data: frames },
    { count: appealCount },
    { data: removalRequests, error: removalQueueError },
    { data: publishedSubmissions, error: publishedQueueError },
  ] = await Promise.all([
    supabase
      .from("submissions")
      .select(
        [
          "id",
          "original_image_path",
          "original_filename",
          "image_mime_type",
          "image_size_bytes",
          "image_width",
          "image_height",
          "orientation",
          "one_line",
          "edited_one_line",
          "display_name_snapshot",
          "is_anonymous",
          "category_id",
          "frame_id",
          "created_at",
        ].join(",")
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("frames")
      .select("id, name, orientation")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("appeals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("removal_requests")
      .select("id, submission_id, reason, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("submissions")
      .select(
        "id, display_image_path, image_width, image_height, orientation, one_line, edited_one_line, display_name_snapshot, is_anonymous, is_photo_of_week, is_category_featured, created_at"
      )
      .eq("status", "approved")
      .order("approved_at", { ascending: false }),
  ]);

  const queue = pendingSubmissions ?? [];
  const published = publishedSubmissions ?? [];
  const pendingRemovalRequests = removalRequests ?? [];
  const publishedById = new Map(
    published.map((submission) => [submission.id, submission])
  );
  const submissionIds = queue.map((submission) => submission.id);
  const imagePaths = queue.map(
    (submission) => submission.original_image_path
  );

  const displayPaths = published
    .map((submission) => submission.display_image_path)
    .filter(Boolean);

  const [
    { data: tagLinks },
    { data: tags },
    { data: publishedAdminEdits },
    signedResult,
    displaySignedResult,
  ] =
    await Promise.all([
      submissionIds.length
        ? supabase
            .from("submission_tags")
            .select("submission_id, tag_id")
            .in("submission_id", submissionIds)
        : Promise.resolve({ data: [] }),
      supabase.from("tags").select("id, name"),
      published.length
        ? supabase
            .from("admin_edits")
            .select(
              "id, submission_id, admin_id, changed_field, old_value, new_value, reason, created_at"
            )
            .in(
              "submission_id",
              published.map((submission) => submission.id)
            )
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      imagePaths.length
        ? supabase.storage
            .from(STORAGE_BUCKETS.originalImages)
            .createSignedUrls(imagePaths, 15 * 60)
        : Promise.resolve({ data: [] }),
      displayPaths.length
        ? supabase.storage
            .from(STORAGE_BUCKETS.displayImages)
            .createSignedUrls(displayPaths, 15 * 60)
        : Promise.resolve({ data: [] }),
    ]);

  const tagsBySubmission = getTagsBySubmission(tagLinks ?? [], tags ?? []);
  const publishedChangesBySubmission = buildAdminChangeEvents(
    publishedAdminEdits ?? [],
    {
      categoryById: new Map(
        (categories ?? []).map((category) => [category.id, category.name])
      ),
      frameById: new Map(
        (frames ?? []).map((frame) => [frame.id, frame.name])
      ),
    }
  );
  const signedUrls = new Map(
    (signedResult.data ?? [])
      .filter((item) => item.path && item.signedUrl)
      .map((item) => [item.path, item.signedUrl])
  );
  const displaySignedUrls = new Map(
    (displaySignedResult.data ?? [])
      .filter((item) => item.path && item.signedUrl)
      .map((item) => [item.path, item.signedUrl])
  );
  const message = typeof params?.message === "string" ? params.message : "";
  const actionError = typeof params?.error === "string" ? params.error : "";

  return (
    <main className="page-shell page-shell-wide admin-page">
      <div className="admin-heading-row">
        <PageIntro
          eyebrow="restricted moderation area"
          title="admin workspace"
          description="Publish untouched submissions directly, publish corrected versions with a note, or reject with a clear explanation."
        />
        <div className="admin-badge">
          <Icon name="shield" size={17} />
          verified admin
        </div>
      </div>

      {actionError ? (
        <p className="auth-message auth-error" role="alert">
          {actionError}
        </p>
      ) : null}
      {message ? <p className="auth-message auth-success">{message}</p> : null}
      {queueError ? (
        <p className="auth-message auth-error" role="alert">
          The review queue could not be loaded.
        </p>
      ) : null}
      {removalQueueError || publishedQueueError ? (
        <p className="auth-message auth-error" role="alert">
          The publication-removal workspace could not be fully loaded.
        </p>
      ) : null}

      <div className="admin-stats">
        <article>
          <span>{String(queue.length).padStart(2, "0")}</span>
          <p>pending review</p>
        </article>
        <article>
          <span>{String(appealCount ?? 0).padStart(2, "0")}</span>
          <p>open appeals</p>
        </article>
        <article>
          <span>{String(pendingRemovalRequests.length).padStart(2, "0")}</span>
          <p>removal requests</p>
        </article>
        <article>
          <Icon
            name={
              queue.length || pendingRemovalRequests.length
                ? "journal"
                : "check"
            }
            size={25}
          />
          <p>
            {queue.length || pendingRemovalRequests.length
              ? "review needed"
              : "all quiet"}
          </p>
        </article>
      </div>

      <section className="review-queue">
        <div className="review-queue-heading">
          <div>
            <p className="eyebrow">oldest first</p>
            <h2>pending review.</h2>
          </div>
          <p>
            Signed image previews expire after fifteen minutes. Refresh this
            page to renew them.
          </p>
        </div>

        {queue.length ? (
          <div className="review-list">
            {queue.map((submission, index) => {
              const imageUrl = signedUrls.get(
                submission.original_image_path
              );
              const submissionTags =
                tagsBySubmission.get(submission.id) ?? [];
              const effectiveLine =
                submission.edited_one_line || submission.one_line;
              const compatibleFrames = (frames ?? []).filter(
                (frame) =>
                  frame.orientation === "any" ||
                  frame.orientation === submission.orientation
              );

              return (
                <article className="review-card" key={submission.id}>
                  <div className="review-card-index">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="review-image-panel">
                    <div
                      className={`review-image ${submission.orientation}`}
                      style={getImageFrameStyle(submission)}
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`Private review preview: ${effectiveLine}`}
                          fill
                          sizes="(max-width: 900px) 100vw, 42vw"
                          unoptimized
                        />
                      ) : (
                        <div className="review-image-missing">
                          <Icon name="camera" size={26} />
                          <span>private preview unavailable</span>
                        </div>
                      )}
                    </div>

                    <dl className="review-file-meta">
                      <div>
                        <dt>submitted</dt>
                        <dd>
                          {DATE_FORMATTER.format(
                            new Date(submission.created_at)
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>file</dt>
                        <dd>{submission.original_filename || "unnamed"}</dd>
                      </div>
                      <div>
                        <dt>image</dt>
                        <dd>
                          {submission.image_width && submission.image_height
                            ? `${submission.image_width} x ${submission.image_height}`
                            : submission.orientation}
                          {submission.image_size_bytes
                            ? ` / ${(
                                submission.image_size_bytes /
                                1024 /
                                1024
                              ).toFixed(1)} MB`
                            : ""}
                        </dd>
                      </div>
                    </dl>

                    <div className="immutable-image-note">
                      <Icon name="shield" size={15} />
                      original image is immutable
                    </div>
                  </div>

                  <form
                    className="moderation-form"
                    action={reviewSubmission}
                  >
                    <input
                      type="hidden"
                      name="submissionId"
                      value={submission.id}
                    />

                    <div className="moderation-field moderation-field-line">
                      <label htmlFor={`line-${submission.id}`}>
                        public one line
                      </label>
                      <textarea
                        id={`line-${submission.id}`}
                        name="oneLine"
                        defaultValue={effectiveLine}
                        maxLength={SUBMISSION_LIMITS.lineCharacters}
                        required
                      />
                    </div>

                    <div className="moderation-grid">
                      <label>
                        <span>category</span>
                        <select
                          name="categoryId"
                          defaultValue={submission.category_id}
                          required
                        >
                          {(categories ?? []).map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>frame</span>
                        <select
                          name="frameId"
                          defaultValue={submission.frame_id ?? ""}
                        >
                          <option value="">no frame selected</option>
                          {compatibleFrames.map((frame) => (
                            <option key={frame.id} value={frame.id}>
                              {frame.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="moderation-field">
                      <span>mood tags</span>
                      <input
                        name="tags"
                        type="text"
                        defaultValue={submissionTags.join(", ")}
                        placeholder="quiet, rain, commute"
                      />
                      <small>
                        comma separated / up to {SUBMISSION_LIMITS.tagCount}
                      </small>
                    </label>

                    <div className="moderation-credit">
                      <label>
                        <span>public display name</span>
                        <input
                          name="displayNameSnapshot"
                          type="text"
                          defaultValue={submission.display_name_snapshot ?? ""}
                          maxLength={SUBMISSION_LIMITS.displayNameCharacters}
                        />
                      </label>
                      <label className="moderation-checkbox">
                        <input
                          name="isAnonymous"
                          type="checkbox"
                          defaultChecked={submission.is_anonymous}
                        />
                        <span>publish anonymously</span>
                      </label>
                    </div>

                    <label className="moderation-field moderation-reason">
                      <span>note for edits or rejection</span>
                      <textarea
                        name="reason"
                        maxLength={SUBMISSION_LIMITS.editReasonCharacters}
                        placeholder="Required only when publishing with edits or rejecting."
                      />
                      <small>
                        Direct publishing needs no note. Notes are visible to
                        the submission owner.
                      </small>
                    </label>

                    <ModerationSubmitButtons />
                  </form>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="review-empty">
            <Icon name="check" size={28} />
            <h3>the queue is clear.</h3>
            <p>New pending submissions will appear here automatically.</p>
          </div>
        )}
      </section>

      <section className="admin-removal-section" id="removal-requests">
        <div className="review-queue-heading">
          <div>
            <p className="eyebrow">owner requested</p>
            <h2>removal requests.</h2>
          </div>
          <p>
            Accepting immediately removes the post from the gallery. The
            private original remains stored for audit and account history.
          </p>
        </div>

        {pendingRemovalRequests.length ? (
          <div className="removal-review-list">
            {pendingRemovalRequests.map((request) => {
              const submission = publishedById.get(request.submission_id);
              const imageUrl = submission?.display_image_path
                ? displaySignedUrls.get(submission.display_image_path)
                : null;
              const line = submission
                ? submission.edited_one_line || submission.one_line
                : "Related published post unavailable";

              return (
                <article className="removal-review-card" key={request.id}>
                  <div
                    className={`removal-review-image ${submission?.orientation || "landscape"}`}
                    style={getImageFrameStyle(submission)}
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={line}
                        fill
                        sizes="(max-width: 760px) 100vw, 310px"
                        unoptimized
                      />
                    ) : (
                      <div>
                        <Icon name="camera" size={23} />
                        preview unavailable
                      </div>
                    )}
                  </div>

                  <div className="removal-review-copy">
                    <div className="removal-review-meta">
                      <span>pending request</span>
                      <time dateTime={request.created_at}>
                        {DATE_FORMATTER.format(new Date(request.created_at))}
                      </time>
                    </div>
                    <h3>{line}</h3>
                    <div className="removal-owner-reason">
                      <strong>owner&apos;s reason</strong>
                      <p>{request.reason}</p>
                    </div>

                    <form
                      className="removal-review-form"
                      action={reviewRemovalRequest}
                    >
                      <input
                        type="hidden"
                        name="requestId"
                        value={request.id}
                      />
                      <label htmlFor={`response-${request.id}`}>
                        response to the owner
                      </label>
                      <textarea
                        id={`response-${request.id}`}
                        name="response"
                        maxLength={SUBMISSION_LIMITS.editReasonCharacters}
                        placeholder="Explain why this request was accepted or declined."
                        required
                      />
                      <RemovalDecisionButtons />
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="review-empty">
            <Icon name="check" size={27} />
            <h3>no removal requests.</h3>
            <p>Owner requests will appear here for review.</p>
          </div>
        )}
      </section>

      <section className="published-management">
        <div className="review-queue-heading">
          <div>
            <p className="eyebrow">admin initiated</p>
            <h2>published management.</h2>
          </div>
          <p>
            Use direct removal only when the team needs to unpublish a post
            without waiting for an owner request. Every action is audited.
          </p>
        </div>

        {published.length ? (
          <div className="published-management-grid">
            {published.map((submission) => {
              const imageUrl = submission.display_image_path
                ? displaySignedUrls.get(submission.display_image_path)
                : null;
              const line =
                submission.edited_one_line || submission.one_line;
              const hasPendingRequest = pendingRemovalRequests.some(
                (request) => request.submission_id === submission.id
              );

              return (
                <article key={submission.id}>
                  <div
                    className={`published-management-image ${submission.orientation}`}
                    style={getImageFrameStyle(submission)}
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={line}
                        fill
                        sizes="(max-width: 760px) 100vw, 30vw"
                        unoptimized
                      />
                    ) : (
                      <div>
                        <Icon name="camera" size={22} />
                        preview unavailable
                      </div>
                    )}
                    {hasPendingRequest ? (
                      <span>owner request pending</span>
                    ) : null}
                  </div>
                  <div className="published-management-copy">
                    <div className="publication-highlight-controls">
                      <form action={updatePublicationHighlight}>
                        <input
                          type="hidden"
                          name="submissionId"
                          value={submission.id}
                        />
                        <input
                          type="hidden"
                          name="highlight"
                          value="featured"
                        />
                        <input
                          type="hidden"
                          name="enabled"
                          value={String(!submission.is_category_featured)}
                        />
                        <button
                          type="submit"
                          className={
                            submission.is_category_featured ? "is-active" : ""
                          }
                          aria-pressed={submission.is_category_featured}
                        >
                          <Icon name="sparkle" size={13} />
                          {submission.is_category_featured
                            ? "featured"
                            : "make featured"}
                        </button>
                      </form>

                      <form action={updatePublicationHighlight}>
                        <input
                          type="hidden"
                          name="submissionId"
                          value={submission.id}
                        />
                        <input
                          type="hidden"
                          name="highlight"
                          value="photo_of_week"
                        />
                        <input
                          type="hidden"
                          name="enabled"
                          value={String(!submission.is_photo_of_week)}
                        />
                        <button
                          type="submit"
                          className={
                            submission.is_photo_of_week
                              ? "is-active is-week"
                              : ""
                          }
                          aria-pressed={submission.is_photo_of_week}
                        >
                          <Icon name="camera" size={13} />
                          {submission.is_photo_of_week
                            ? "photo of the week"
                            : "set as photo of week"}
                        </button>
                      </form>
                    </div>
                    <h3>{line}</h3>
                    <p>
                      {submission.is_anonymous
                        ? "anonymous"
                        : submission.display_name_snapshot || "named post"}
                    </p>
                    <AdminChangeHistory
                      events={
                        publishedChangesBySubmission.get(submission.id) ?? []
                      }
                      compact
                    />
                    <form
                      action={removePublishedSubmission}
                      className="published-removal-form"
                    >
                      <input
                        type="hidden"
                        name="submissionId"
                        value={submission.id}
                      />
                      <label htmlFor={`direct-removal-${submission.id}`}>
                        direct removal reason
                      </label>
                      <textarea
                        id={`direct-removal-${submission.id}`}
                        name="reason"
                        maxLength={SUBMISSION_LIMITS.editReasonCharacters}
                        placeholder="Required for the audit history and owner."
                        required
                      />
                      <button type="submit">remove published post</button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="review-empty">
            <Icon name="journal" size={27} />
            <h3>nothing is published.</h3>
            <p>Approved posts will appear here for admin management.</p>
          </div>
        )}
      </section>
    </main>
  );
}
