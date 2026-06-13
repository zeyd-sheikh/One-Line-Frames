import Image from "next/image";
import { notFound } from "next/navigation";
import Icon from "../../components/Icon";
import ModerationSubmitButtons from "../../components/ModerationSubmitButtons";
import PageIntro from "../../components/PageIntro";
import { STORAGE_BUCKETS } from "../../constants/database";
import { SUBMISSION_LIMITS } from "../../constants/product";
import { requireAuthenticatedUser } from "../../lib/auth";
import { reviewSubmission } from "./actions";

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
  const { supabase, claims } = await requireAuthenticatedUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .maybeSingle();

  if (profile?.role !== "admin") {
    notFound();
  }

  const [
    { data: pendingSubmissions, error: queueError },
    { data: categories },
    { data: frames },
    { count: appealCount },
    { count: removalCount },
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
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const queue = pendingSubmissions ?? [];
  const submissionIds = queue.map((submission) => submission.id);
  const imagePaths = queue.map(
    (submission) => submission.original_image_path
  );

  const [{ data: tagLinks }, { data: tags }, signedResult] =
    await Promise.all([
      submissionIds.length
        ? supabase
            .from("submission_tags")
            .select("submission_id, tag_id")
            .in("submission_id", submissionIds)
        : Promise.resolve({ data: [] }),
      supabase.from("tags").select("id, name"),
      imagePaths.length
        ? supabase.storage
            .from(STORAGE_BUCKETS.originalImages)
            .createSignedUrls(imagePaths, 15 * 60)
        : Promise.resolve({ data: [] }),
    ]);

  const tagsBySubmission = getTagsBySubmission(tagLinks ?? [], tags ?? []);
  const signedUrls = new Map(
    (signedResult.data ?? [])
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
          description="Review the private original, refine public metadata, and record a reason for every edit or decision."
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
          <span>{String(removalCount ?? 0).padStart(2, "0")}</span>
          <p>removal requests</p>
        </article>
        <article>
          <Icon name={queue.length ? "journal" : "check"} size={25} />
          <p>{queue.length ? "review needed" : "all quiet"}</p>
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
                    <div className={`review-image ${submission.orientation}`}>
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
                      <span>reason for edits or decision</span>
                      <textarea
                        name="reason"
                        maxLength={SUBMISSION_LIMITS.editReasonCharacters}
                        placeholder="Required. This will be visible to the submission owner."
                        required
                      />
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
    </main>
  );
}
