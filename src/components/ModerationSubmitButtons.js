"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Icon from "./Icon";

export default function ModerationSubmitButtons() {
  const { pending } = useFormStatus();
  const [guidance, setGuidance] = useState("");

  function getFormState(button) {
    const form = button.form;
    const trackedFields = [
      "oneLine",
      "categoryId",
      "frameId",
      "tags",
      "displayNameSnapshot",
      "isAnonymous",
    ];
    const changed = trackedFields.some((name) => {
      const field = form?.elements.namedItem(name);

      if (!field) {
        return false;
      }

      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        return field.checked !== field.defaultChecked;
      }

      if (field instanceof HTMLSelectElement) {
        const originalOption = [...field.options].find(
          (option) => option.defaultSelected
        );
        const originalValue =
          originalOption?.value ?? field.options[0]?.value ?? "";

        return field.value !== originalValue;
      }

      return field.value.trim() !== field.defaultValue.trim();
    });
    const reasonField = form?.elements.namedItem("reason");
    const reason = reasonField?.value.trim() ?? "";

    return { changed, reason };
  }

  function validateChoice(event, decision) {
    const { changed, reason } = getFormState(event.currentTarget);
    let nextGuidance = "";

    if (decision === "publish" && changed) {
      nextGuidance =
        "Edits are present. Use Publish with edits and include a note.";
    } else if (decision === "publish_edits" && !changed) {
      nextGuidance = "Nothing changed. Use Publish instead.";
    } else if (decision === "publish_edits" && !reason) {
      nextGuidance = "Add a short note explaining the edits.";
    } else if (decision === "reject" && !reason) {
      nextGuidance = "Add a rejection reason for the submission owner.";
    }

    if (nextGuidance) {
      event.preventDefault();
      setGuidance(nextGuidance);
    } else {
      setGuidance("");
    }
  }

  return (
    <>
      {guidance ? (
        <p className="moderation-action-guidance" role="alert">
          {guidance}
        </p>
      ) : null}
      <div className="moderation-actions">
        <button
          type="submit"
          name="decision"
          value="reject"
          className="moderation-reject"
          disabled={pending}
          onClick={(event) => validateChoice(event, "reject")}
        >
          reject
        </button>
        <button
          type="submit"
          name="decision"
          value="publish_edits"
          className="moderation-publish-edits"
          disabled={pending}
          onClick={(event) => validateChoice(event, "publish_edits")}
        >
          publish with edits
        </button>
        <button
          type="submit"
          name="decision"
          value="publish"
          className="moderation-approve"
          disabled={pending}
          onClick={(event) => validateChoice(event, "publish")}
        >
          {pending ? "working..." : "publish"}{" "}
          <Icon name="check" size={15} />
        </button>
      </div>
    </>
  );
}
