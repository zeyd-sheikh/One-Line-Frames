"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getImageFrameStyle } from "../lib/imagePresentation";
import Icon from "./Icon";
import MomentVisual from "./MomentVisual";
import PostCard from "./PostCard";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function slugifyCategory(categoryName) {
  return String(categoryName)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function MomentGallery({ submissions }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState("gallery");
  const [order, setOrder] = useState(submissions);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [photoFullscreen, setPhotoFullscreen] = useState(false);
  const closeButtonRef = useRef(null);
  const photoCloseButtonRef = useRef(null);
  const modalRef = useRef(null);
  const photoDialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const categories = useMemo(
    () => {
      const categoryBySlug = new Map();

      submissions.forEach((submission) => {
        const name = submission.categoryName;
        const slug = submission.categorySlug || slugifyCategory(name);

        if (!name || !slug || categoryBySlug.has(slug)) {
          return;
        }

        categoryBySlug.set(slug, {
          label: name,
          slug,
        });
      });

      return [{ label: "all", slug: "all" }, ...categoryBySlug.values()];
    },
    [submissions]
  );
  const activeCategoryLabel =
    categories.find((category) => category.slug === activeCategory)?.label ??
    "all";

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return order.filter((submission) => {
      const submissionCategorySlug =
        submission.categorySlug || slugifyCategory(submission.categoryName);
      const matchesCategory =
        activeCategory === "all" || submissionCategorySlug === activeCategory;
      const searchable = [
        submission.line,
        submission.categoryName,
        submission.categorySlug,
        submission.displayName,
        ...submission.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchable.includes(normalizedQuery);
    });
  }, [activeCategory, order, query]);

  useEffect(() => {
    document.documentElement.dataset.galleryTheme = activeCategory;

    return () => {
      delete document.documentElement.dataset.galleryTheme;
    };
  }, [activeCategory]);

  useEffect(() => {
    if (!selectedMoment) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (photoFullscreen) {
      photoCloseButtonRef.current?.focus();
    } else {
      closeButtonRef.current?.focus();
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (photoFullscreen) {
          setPhotoFullscreen(false);
        } else {
          setSelectedMoment(null);
          window.requestAnimationFrame(() =>
            previousFocusRef.current?.focus()
          );
        }
      }

      if (event.key === "Tab") {
        const activeDialog = photoFullscreen
          ? photoDialogRef.current
          : modalRef.current;
        const focusable = activeDialog
          ? [
              ...activeDialog.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
              ),
            ]
          : [];

        if (!focusable.length) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [photoFullscreen, selectedMoment]);

  function handleShuffle() {
    setOrder((current) => shuffle(current));
  }

  function openMoment(submission) {
    previousFocusRef.current = document.activeElement;
    setPhotoFullscreen(false);
    setSelectedMoment(submission);
  }

  function closeMoment() {
    setPhotoFullscreen(false);
    setSelectedMoment(null);
    window.requestAnimationFrame(() => previousFocusRef.current?.focus());
  }

  return (
    <section className="moment-gallery-section" id="moments">
      <div className="gallery-heading">
        <div>
          <p className="eyebrow">the wall today</p>
          <h2>small things, noticed.</h2>
        </div>
        <p>
          A changing wall of student moments. Open one slowly, search for a
          feeling, or let the order surprise you.
        </p>
      </div>

      <div className="gallery-toolbar">
        <div
          className="category-tabs"
          role="group"
          aria-label="Filter by category"
        >
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              className={activeCategory === category.slug ? "active" : ""}
              onClick={() => setActiveCategory(category.slug)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="gallery-tools">
          <label className="moment-search">
            <Icon name="search" size={16} />
            <span className="sr-only">Search moments and tags</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="search a feeling..."
            />
          </label>

          <button
            type="button"
            className="tool-button"
            onClick={handleShuffle}
            aria-label="Shuffle moments"
            title="Shuffle moments"
          >
            <Icon name="shuffle" size={17} />
          </button>

          <div
            className="layout-switcher"
            role="group"
            aria-label="Choose gallery layout"
          >
            <button
              type="button"
              className={layout === "gallery" ? "active" : ""}
              onClick={() => setLayout("gallery")}
              aria-label="Gallery layout"
              aria-pressed={layout === "gallery"}
            >
              <Icon name="grid" size={16} />
            </button>
            <button
              type="button"
              className={layout === "journal" ? "active" : ""}
              onClick={() => setLayout("journal")}
              aria-label="Journal layout"
              aria-pressed={layout === "journal"}
            >
              <Icon name="journal" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="gallery-result-line" aria-live="polite">
        <div className="gallery-result-meta">
          <span>
            {filtered.length} {filtered.length === 1 ? "moment" : "moments"}
          </span>
          {activeCategory !== "all" ? (
            <small>{activeCategoryLabel} atmosphere</small>
          ) : null}
        </div>
        {query || activeCategory !== "all" ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveCategory("all");
            }}
          >
            clear filters
          </button>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <div
          className={[
            "gallery",
            `gallery-${layout}`,
            layout === "gallery" && filtered.length === 1
              ? "gallery-count-one"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {filtered.map((submission, index) => (
            <PostCard
              key={submission.id}
              submission={submission}
              index={index}
              layout={layout}
              onOpen={openMoment}
            />
          ))}
        </div>
      ) : (
        <div className="gallery-empty">
          <Icon name="search" size={24} />
          <p>nothing is sitting under that feeling yet.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveCategory("all");
            }}
          >
            return to every moment
          </button>
        </div>
      )}

      {selectedMoment ? (
        <div
          className="moment-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMoment();
            }
          }}
        >
          <section
            ref={modalRef}
            className="moment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="moment-dialog-title"
            aria-hidden={photoFullscreen || undefined}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="modal-close"
              onClick={closeMoment}
              aria-label="Close moment"
            >
              <Icon name="close" size={18} />
            </button>

            <div
              className={`modal-visual ${selectedMoment.orientation} ${selectedMoment.frameCssClass || ""}`}
              style={getImageFrameStyle(selectedMoment)}
            >
              <MomentVisual submission={selectedMoment} />
              {selectedMoment.displayImageUrl ? (
                <button
                  type="button"
                  className="modal-photo-button"
                  onClick={() => setPhotoFullscreen(true)}
                >
                  <Icon name="expand" size={15} />
                  view photo fullscreen
                </button>
              ) : null}
            </div>

            <div className="modal-copy">
              <p className="eyebrow">{selectedMoment.categoryName}</p>
              <h2 id="moment-dialog-title">{selectedMoment.line}</h2>
              <div className="modal-byline">
                <span>
                  {selectedMoment.isAnonymous
                    ? "anonymous"
                    : selectedMoment.displayName || "anonymous"}
                </span>
                <time dateTime={selectedMoment.createdAt}>
                  {DATE_FORMATTER.format(new Date(selectedMoment.createdAt))}
                </time>
              </div>
              <div className="post-tags">
                {selectedMoment.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
              <p className="modal-note">
                no reactions needed. you can simply let the moment stay with
                you.
              </p>
            </div>
          </section>

          {photoFullscreen ? (
            <div
              ref={photoDialogRef}
              className="photo-fullscreen-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="Fullscreen photo"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setPhotoFullscreen(false);
                }
              }}
            >
              <button
                ref={photoCloseButtonRef}
                type="button"
                className="photo-fullscreen-close"
                onClick={() => setPhotoFullscreen(false)}
                aria-label="Exit fullscreen photo"
              >
                <Icon name="close" size={19} />
                <span>exit photo</span>
              </button>
              <div
                className={`photo-fullscreen-visual ${selectedMoment.orientation}`}
                style={getImageFrameStyle(selectedMoment)}
              >
                <MomentVisual
                  submission={selectedMoment}
                  sizes="100vw"
                  unoptimized
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
