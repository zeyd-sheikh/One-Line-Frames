"use client";

import { useRef, useState } from "react";
import Icon from "./Icon";

function normalizeTag(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function TagInput({
  id,
  name,
  limit,
  characterLimit,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [tags, setTags] = useState([]);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const isFull = tags.length >= limit;

  function addTags(values) {
    const candidates = values.map(normalizeTag).filter(Boolean);

    if (!candidates.length) {
      return;
    }

    const nextTags = [...tags];
    let nextMessage = "";

    candidates.forEach((candidate) => {
      if (nextTags.includes(candidate)) {
        nextMessage = "That tag is already included.";
        return;
      }

      if (candidate.length > characterLimit) {
        nextMessage = `Keep each tag under ${characterLimit} characters.`;
        return;
      }

      if (!/^[a-z0-9][a-z0-9 '-]*$/.test(candidate)) {
        nextMessage =
          "Use letters, numbers, spaces, apostrophes, or hyphens.";
        return;
      }

      if (nextTags.length >= limit) {
        nextMessage = `You can add up to ${limit} mood tags.`;
        return;
      }

      nextTags.push(candidate);
    });

    setTags(nextTags);
    setDraft("");
    setMessage(nextMessage);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTags([draft]);
      return;
    }

    if (event.key === "Backspace" && !draft && tags.length) {
      setTags(tags.slice(0, -1));
      setMessage("");
    }
  }

  function handleChange(event) {
    const value = event.target.value;

    if (value.includes(",")) {
      addTags(value.split(","));
      return;
    }

    setDraft(value);
    setMessage("");
  }

  function handleBlur() {
    if (draft.trim()) {
      addTags([draft]);
    }
  }

  function removeTag(tagToRemove) {
    setTags(tags.filter((tag) => tag !== tagToRemove));
    setMessage("");
    inputRef.current?.focus();
  }

  return (
    <div className="tag-input-group">
      <input name={name} type="hidden" value={tags.join(",")} />
      <div
        className={`tag-input-shell ${message ? "has-error" : ""}`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span className="tag-chip" key={tag}>
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={(event) => {
                event.stopPropagation();
                removeTag(tag);
              }}
              disabled={disabled}
            >
              <Icon name="close" size={11} />
            </button>
          </span>
        ))}
        {isFull ? (
          <span className="tag-input-limit">tag limit reached</span>
        ) : (
          <input
            id={id}
            ref={inputRef}
            type="text"
            value={draft}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            maxLength={characterLimit}
            placeholder={
              tags.length ? "add another..." : "type a tag, press enter"
            }
            disabled={disabled}
            aria-describedby={`${name}-help`}
          />
        )}
      </div>
      <div className="tag-input-meta" id={`${name}-help`}>
        <small className={message ? "tag-input-error" : ""}>
          {message ||
            (isFull
              ? `maximum of ${limit} tags added`
              : "press enter or comma to create a tag")}
        </small>
        <small>
          {tags.length}/{limit}
        </small>
      </div>
    </div>
  );
}
