"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DATABASE_FUNCTIONS } from "../../../constants/database";
import { SUBMISSION_LIMITS } from "../../../constants/product";
import { ROUTES } from "../../../constants/routes";
import { requireAuthenticatedUser } from "../../../lib/auth";

function redirectWithMessage(key, message) {
  redirect(
    `${ROUTES.profileSubmissions}?view=published&${key}=${encodeURIComponent(message)}`
  );
}

export async function requestSubmissionRemoval(formData) {
  const submissionId = String(formData.get("submissionId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!submissionId) {
    redirectWithMessage("error", "Choose a published submission.");
  }

  if (
    !reason ||
    reason.length > SUBMISSION_LIMITS.removalReasonCharacters
  ) {
    redirectWithMessage(
      "error",
      `Provide a removal reason between 1 and ${SUBMISSION_LIMITS.removalReasonCharacters} characters.`
    );
  }

  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.rpc(
    DATABASE_FUNCTIONS.requestSubmissionRemoval,
    {
      p_submission_id: submissionId,
      p_reason: reason,
    }
  );

  if (error) {
    redirectWithMessage(
      "error",
      error.message || "The removal request could not be submitted."
    );
  }

  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.profileSubmissions);
  revalidatePath(ROUTES.admin);
  redirectWithMessage(
    "message",
    "Your removal request was sent to the admin team."
  );
}
