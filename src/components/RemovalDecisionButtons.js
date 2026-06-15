"use client";

import { useFormStatus } from "react-dom";

export default function RemovalDecisionButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="removal-decision-actions">
      <button
        type="submit"
        name="decision"
        value="reject"
        disabled={pending}
      >
        decline request
      </button>
      <button
        type="submit"
        name="decision"
        value="accept"
        disabled={pending}
      >
        {pending ? "processing..." : "accept and remove"}
      </button>
    </div>
  );
}
