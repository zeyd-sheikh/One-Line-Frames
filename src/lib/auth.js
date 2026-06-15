import { notFound, redirect } from "next/navigation";
import { ROUTES } from "../constants/routes";
import { hasVerifiedAdminAccess } from "./adminAccess";
import { createClient } from "./supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    return { supabase, claims: null };
  }

  return { supabase, claims };
}

export async function requireAuthenticatedUser() {
  const auth = await getAuthenticatedUser();

  if (!auth.claims) {
    redirect(`${ROUTES.login}?error=${encodeURIComponent("Please log in to continue.")}`);
  }

  return auth;
}

export async function requireAdminUser({ verified = false } = {}) {
  const auth = await requireAuthenticatedUser();
  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.claims.sub)
    .maybeSingle();

  if (profile?.role !== "admin") {
    notFound();
  }

  if (verified && !(await hasVerifiedAdminAccess(auth.claims))) {
    redirect(ROUTES.adminVerify);
  }

  return { ...auth, profile };
}
