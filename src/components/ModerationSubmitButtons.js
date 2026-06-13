"use client";

import { useFormStatus } from "react-dom";
import Icon from "./Icon";

export default function ModerationSubmitButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="moderation-actions">
      <button
        type="submit"
        name="decision"
        value="save"
        className="moderation-save"
        disabled={pending}
      >
        {pending ? "saving..." : "save edits"}
      </button>
      <button
        type="submit"
        name="decision"
        value="reject"
        className="moderation-reject"
        disabled={pending}
      >
        reject
      </button>
      <button
        type="submit"
        name="decision"
        value="approve"
        className="moderation-approve"
        disabled={pending}
      >
        approve <Icon name="check" size={15} />
      </button>
    </div>
  );
}
