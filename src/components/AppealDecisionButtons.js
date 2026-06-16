"use client";

import { useFormStatus } from "react-dom";

export default function AppealDecisionButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="removal-decision-actions appeal-decision-actions">
      <button
        type="submit"
        name="decision"
        value="reject"
        disabled={pending}
      >
        decline appeal
      </button>
      <button
        type="submit"
        name="decision"
        value="accept"
        disabled={pending}
      >
        {pending ? "processing..." : "accept appeal"}
      </button>
    </div>
  );
}
