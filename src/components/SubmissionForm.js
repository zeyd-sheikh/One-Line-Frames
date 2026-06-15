"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSubmission } from "../app/submit/actions";
import { STORAGE_BUCKETS } from "../constants/database";
import {
  SUBMISSION_LIMITS,
  SUPPORTED_IMAGE_MIME_TYPES,
} from "../constants/product";
import { ROUTES } from "../constants/routes";
import { createClient } from "../lib/supabase/client";
import Icon from "./Icon";
import TagInput from "./TagInput";

const EXTENSION_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

const TYPE_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

function getFileType(file) {
  if (SUPPORTED_IMAGE_MIME_TYPES.includes(file.type)) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return TYPE_BY_EXTENSION[extension] ?? "";
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getOrientation(width, height) {
  if (!width || !height) {
    return null;
  }

  const ratio = width / height;

  if (ratio > 1.08) {
    return "landscape";
  }

  if (ratio < 0.92) {
    return "portrait";
  }

  return "square";
}

async function readImageDimensions(file) {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch {
      // Fall back to an image element for browsers with partial bitmap support.
    }
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };

    image.src = url;
  });
}

export default function SubmissionForm({
  categories,
  userId,
  profileDisplayName,
  acceptedTerms,
}) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dimensions, setDimensions] = useState({
    width: null,
    height: null,
  });
  const [orientation, setOrientation] = useState(null);
  const [creditMode, setCreditMode] = useState(
    profileDisplayName ? "profile" : "anonymous"
  );
  const [customDisplayName, setCustomDisplayName] = useState("");
  const [line, setLine] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(acceptedTerms);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = useMemo(
    () =>
      profileDisplayName
        ?.split(/\s+/)
        .filter(Boolean)
        .slice(0, 4)
        .map((part) => part.charAt(0).toUpperCase())
        .join(".") || "",
    [profileDisplayName]
  );

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl]
  );

  async function handleFileChange(event) {
    const nextFile = event.target.files?.[0] ?? null;
    setStatus({ type: "", message: "" });

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!nextFile) {
      setFile(null);
      setPreviewUrl("");
      setDimensions({ width: null, height: null });
      setOrientation(null);
      return;
    }

    const nextFileType = getFileType(nextFile);

    if (!nextFileType) {
      event.target.value = "";
      setStatus({
        type: "error",
        message: "Choose a JPEG, PNG, WebP, HEIC, or HEIF image.",
      });
      return;
    }

    if (nextFile.size > SUBMISSION_LIMITS.imageBytes) {
      event.target.value = "";
      setStatus({
        type: "error",
        message: "The image must be no larger than 25 MB.",
      });
      return;
    }

    const nextDimensions = await readImageDimensions(nextFile);
    const detectedOrientation = getOrientation(
      nextDimensions.width,
      nextDimensions.height
    );

    if (!detectedOrientation) {
      event.target.value = "";
      setFile(null);
      setPreviewUrl("");
      setDimensions({ width: null, height: null });
      setOrientation(null);
      setStatus({
        type: "error",
        message:
          "This browser could not read the image dimensions. Try a JPEG, PNG, or WebP file.",
      });
      return;
    }

    setFile(nextFile);
    setDimensions(nextDimensions);
    setOrientation(detectedOrientation);

    if (!["image/heic", "image/heif"].includes(nextFileType)) {
      setPreviewUrl(URL.createObjectURL(nextFile));
    } else {
      setPreviewUrl("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!file || !orientation) {
      setStatus({ type: "error", message: "Choose a photo first." });
      return;
    }

    if (!line.trim()) {
      setStatus({ type: "error", message: "Write your one line first." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "progress", message: "uploading your photo privately..." });

    const fileType = getFileType(file);
    const extension = EXTENSION_BY_TYPE[fileType];
    const objectId = crypto.randomUUID();
    const imagePath = `${userId}/${objectId}.${extension}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.originalImages)
      .upload(imagePath, file, {
        cacheControl: "3600",
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      const isPolicyError = /row-level security|policy/i.test(
        uploadError.message ?? ""
      );

      setStatus({
        type: "error",
        message: isPolicyError
          ? "Private uploads are not enabled in Supabase yet. Apply the submission workflow migration, then try again."
          : uploadError.message ||
            "The private image upload failed. Please try again.",
      });
      setIsSubmitting(false);
      return;
    }

    setStatus({ type: "progress", message: "saving your moment..." });

    try {
      formData.delete("photo");
      formData.set("originalImagePath", imagePath);
      formData.set("originalFilename", file.name);
      formData.set("imageMimeType", fileType);
      formData.set("imageSizeBytes", String(file.size));
      formData.set(
        "imageWidth",
        dimensions.width ? String(dimensions.width) : ""
      );
      formData.set(
        "imageHeight",
        dimensions.height ? String(dimensions.height) : ""
      );
      formData.set("orientation", orientation);
      formData.set("creditMode", creditMode);
      formData.set("acceptTerms", termsAccepted ? "true" : "false");

      const result = await createSubmission(formData);

      if (!result?.ok) {
        setStatus({
          type: "error",
          message: result?.error || "We could not save your submission.",
        });
        setIsSubmitting(false);
        return;
      }

      setStatus({ type: "success", message: "your moment is awaiting review." });
      router.push(
        `${ROUTES.profile}?message=${encodeURIComponent(
          "Your moment was submitted and is awaiting review."
        )}`
      );
      router.refresh();
    } catch {
      await supabase.storage
        .from(STORAGE_BUCKETS.originalImages)
        .remove([imagePath]);
      setStatus({
        type: "error",
        message:
          "The connection dropped before your moment could be saved. Please try again.",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <form className="submission-form" onSubmit={handleSubmit}>
      <section className="submission-form-main">
        <div className="form-section-heading">
          <span>01</span>
          <div>
            <p className="eyebrow">your photo</p>
            <h2>choose the moment.</h2>
          </div>
        </div>

        <label className={`submission-dropzone ${file ? "has-file" : ""}`}>
          <input
            name="photo"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
            onChange={handleFileChange}
            disabled={isSubmitting}
            required
          />
          {previewUrl ? (
            // A temporary local object URL is not compatible with next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Selected submission preview" />
          ) : (
            <div className="dropzone-copy">
              <span className="dropzone-icon">
                <Icon name="camera" size={27} />
              </span>
              <strong>{file ? file.name : "choose one photo"}</strong>
              <small>
                {file
                  ? `${formatBytes(file.size)} / preview unavailable for this format`
                  : "JPEG, PNG, WebP, HEIC or HEIF / up to 25 MB"}
              </small>
            </div>
          )}
          {file && previewUrl ? (
            <span className="dropzone-file-note">
              {file.name} / {formatBytes(file.size)}
            </span>
          ) : null}
        </label>

        <div className="submission-orientation">
          <span>image shape</span>
          <div className={orientation ? "is-detected" : ""}>
            <Icon name={orientation ? "check" : "camera"} size={13} />
            <span>{orientation || "waiting for a photo"}</span>
            {orientation ? <small>detected automatically</small> : null}
          </div>
        </div>

        <div className="form-section-heading form-section-spaced">
          <span>02</span>
          <div>
            <p className="eyebrow">your one line</p>
            <h2>say what stayed.</h2>
          </div>
        </div>

        <div className="submission-line-field">
          <textarea
            name="line"
            value={line}
            onChange={(event) => setLine(event.target.value)}
            maxLength={SUBMISSION_LIMITS.lineCharacters}
            placeholder="the ordinary thing that stayed with you..."
            disabled={isSubmitting}
            required
          />
          <span>
            {line.length}/{SUBMISSION_LIMITS.lineCharacters}
          </span>
        </div>

        <div className="submission-field-grid">
          <label className="submission-field">
            <span>category</span>
            <select
              name="categoryId"
              defaultValue=""
              disabled={isSubmitting}
              required
            >
              <option value="" disabled>
                choose one
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="submission-field">
            <label htmlFor="moodTags">mood tags</label>
            <TagInput
              id="moodTags"
              name="tags"
              limit={SUBMISSION_LIMITS.tagCount}
              characterLimit={SUBMISSION_LIMITS.tagCharacters}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </section>

      <aside className="submission-form-sidebar">
        <div className="form-section-heading compact">
          <span>03</span>
          <div>
            <p className="eyebrow">public credit</p>
            <h2>how should it appear?</h2>
          </div>
        </div>

        <div className="credit-options">
          {profileDisplayName ? (
            <>
              <label>
                <input
                  type="radio"
                  name="creditChoice"
                  checked={creditMode === "profile"}
                  onChange={() => setCreditMode("profile")}
                  disabled={isSubmitting}
                />
                <span>
                  <strong>use my name</strong>
                  <small>{profileDisplayName}</small>
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name="creditChoice"
                  checked={creditMode === "initials"}
                  onChange={() => setCreditMode("initials")}
                  disabled={isSubmitting}
                />
                <span>
                  <strong>use initials</strong>
                  <small>{initials}</small>
                </span>
              </label>
            </>
          ) : null}

          <label>
            <input
              type="radio"
              name="creditChoice"
              checked={creditMode === "custom"}
              onChange={() => setCreditMode("custom")}
              disabled={isSubmitting}
            />
            <span>
              <strong>use another name</strong>
              <small>only for this submission</small>
            </span>
          </label>

          <input
            className="credit-custom-input"
            name="customDisplayName"
            type="text"
            value={customDisplayName}
            onChange={(event) => setCustomDisplayName(event.target.value)}
            maxLength={SUBMISSION_LIMITS.displayNameCharacters}
            placeholder="public name or initials"
            hidden={creditMode !== "custom"}
            disabled={isSubmitting || creditMode !== "custom"}
            required={creditMode === "custom"}
          />

          <label>
            <input
              type="radio"
              name="creditChoice"
              checked={creditMode === "anonymous"}
              onChange={() => setCreditMode("anonymous")}
              disabled={isSubmitting}
            />
            <span>
              <strong>post anonymously</strong>
              <small>still privately linked to your account</small>
            </span>
          </label>
        </div>

        <div className="submission-review-note">
          <Icon name="shield" size={19} />
          <div>
            <strong>private until approved</strong>
            <p>
              An admin may correct wording, categories, tags, or framing. Your
              original photo cannot be replaced.
            </p>
          </div>
        </div>

        {!acceptedTerms ? (
          <label className="submission-terms">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              disabled={isSubmitting}
              required
            />
            <span>
              I confirm this is my photo or I have permission to submit it, and
              I accept that it will be reviewed before publication.
            </span>
          </label>
        ) : null}

        {status.message ? (
          <p
            className={`submission-status ${status.type}`}
            role={status.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {status.message}
          </p>
        ) : null}

        <button
          className="submission-submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "holding the moment..." : "submit for review"}
          <Icon name="arrow" size={16} />
        </button>

        <p className="submission-fine-print">
          Submitting creates a private pending record. Nothing appears publicly
          until an admin approves it.
        </p>
      </aside>
    </form>
  );
}
