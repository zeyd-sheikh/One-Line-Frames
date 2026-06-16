"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { requestSubmissionAppeal } from "../app/profile/submissions/actions";
import { SUBMISSION_LIMITS } from "../constants/product";
import Icon from "./Icon";

function AppealSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "sending appeal..." : "send appeal"}
    </button>
  );
}

export default function AppealRequestForm({ submissionId }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        className="appeal-request-trigger"
        onClick={() => setIsOpen(true)}
      >
        appeal this decision
      </button>
    );
  }

  return (
    <form className="appeal-request-form" action={requestSubmissionAppeal}>
      <input type="hidden" name="submissionId" value={submissionId} />
      <label htmlFor={`appeal-text-${submissionId}`}>
        Why should this moment be reviewed again?
      </label>
      <textarea
        id={`appeal-text-${submissionId}`}
        name="appealText"
        maxLength={SUBMISSION_LIMITS.appealCharacters}
        placeholder="Share anything the admin team should reconsider. You can appeal this submission once."
        required
      />
      <div>
        <button type="button" onClick={() => setIsOpen(false)}>
          cancel
        </button>
        <AppealSubmitButton />
      </div>
      <p>
        <Icon name="shield" size={13} />
        If accepted, the moment returns to the private review queue.
      </p>
    </form>
  );
}
