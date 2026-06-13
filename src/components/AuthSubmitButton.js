"use client";

import { useFormStatus } from "react-dom";

export default function AuthSubmitButton({ children, pendingText }) {
  const { pending } = useFormStatus();

  return (
    <button className="auth-submit" type="submit" disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
