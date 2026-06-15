"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { requestSubmissionRemoval } from "../app/profile/submissions/actions";
import { SUBMISSION_LIMITS } from "../constants/product";
import Icon from "./Icon";

function RemovalSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "sending request..." : "send removal request"}
    </button>
  );
}

export default function RemovalRequestForm({ submissionId }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        className="removal-request-trigger"
        onClick={() => setIsOpen(true)}
      >
        request removal
      </button>
    );
  }

  return (
    <form className="removal-request-form" action={requestSubmissionRemoval}>
      <input type="hidden" name="submissionId" value={submissionId} />
      <label htmlFor={`removal-reason-${submissionId}`}>
        Why should this published moment be removed?
      </label>
      <textarea
        id={`removal-reason-${submissionId}`}
        name="reason"
        maxLength={SUBMISSION_LIMITS.removalReasonCharacters}
        placeholder="This explanation is private and will only be seen by the admin team."
        required
      />
      <div>
        <button type="button" onClick={() => setIsOpen(false)}>
          cancel
        </button>
        <RemovalSubmitButton />
      </div>
      <p>
        <Icon name="shield" size={13} />
        The post remains public until an admin accepts the request.
      </p>
    </form>
  );
}
