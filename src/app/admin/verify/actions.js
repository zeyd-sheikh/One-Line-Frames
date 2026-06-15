"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "../../../constants/routes";
import { grantVerifiedAdminAccess } from "../../../lib/adminAccess";
import { requireAdminUser } from "../../../lib/auth";

function redirectWithError(message) {
  redirect(`${ROUTES.adminVerify}?error=${encodeURIComponent(message)}`);
}

export async function verifyAdminAccess(formData) {
  const password = String(formData.get("password") ?? "");

  if (!password) {
    redirectWithError("Enter your account password.");
  }

  const { supabase, claims } = await requireAdminUser();
  const { data: userResult, error: userError } =
    await supabase.auth.getUser();
  const email = userResult.user?.email;

  if (userError || !email) {
    redirectWithError("Your account could not be verified. Log in again.");
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirectWithError("The password was incorrect.");
  }

  const { data: refreshedClaimsResult, error: claimsError } =
    await supabase.auth.getClaims();
  const refreshedClaims = refreshedClaimsResult?.claims;

  if (
    claimsError ||
    !refreshedClaims?.sub ||
    refreshedClaims.sub !== claims.sub
  ) {
    redirectWithError("The refreshed admin session could not be verified.");
  }

  await grantVerifiedAdminAccess(refreshedClaims);
  redirect(ROUTES.admin);
}
