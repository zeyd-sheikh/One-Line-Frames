"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "../../constants/routes";
import { SUBMISSION_LIMITS } from "../../constants/product";
import { createClient } from "../../lib/supabase/server";

function redirectWithMessage(path, key, message) {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return `${protocol}://${host}`;
}

export async function login(formData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirectWithMessage(ROUTES.login, "error", "Enter your email and password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithMessage(
      ROUTES.login,
      "error",
      error.message === "Invalid login credentials"
        ? "Email or password is incorrect."
        : error.message
    );
  }

  redirect(ROUTES.profile);
}

export async function signup(formData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !password || !confirmPassword) {
    redirectWithMessage(
      ROUTES.signup,
      "error",
      "Enter your email, password, and password confirmation."
    );
  }

  if (displayName.length > SUBMISSION_LIMITS.displayNameCharacters) {
    redirectWithMessage(
      ROUTES.signup,
      "error",
      `Display names must be ${SUBMISSION_LIMITS.displayNameCharacters} characters or less.`
    );
  }

  if (password.length < 8) {
    redirectWithMessage(
      ROUTES.signup,
      "error",
      "Use a password with at least 8 characters."
    );
  }

  if (password !== confirmPassword) {
    redirectWithMessage(ROUTES.signup, "error", "Passwords do not match.");
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || null,
      },
      emailRedirectTo: `${origin}${ROUTES.authConfirm}?next=${ROUTES.profile}`,
    },
  });

  if (error) {
    redirectWithMessage(ROUTES.signup, "error", error.message);
  }

  if (data.session) {
    redirect(ROUTES.profile);
  }

  redirectWithMessage(
    ROUTES.signup,
    "message",
    "Check your email to confirm your account, then log in."
  );
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.home);
}
