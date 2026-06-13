import { NextResponse } from "next/server";
import { ROUTES } from "../../../constants/routes";
import { createClient } from "../../../lib/supabase/server";

function getSafeNextPath(next) {
  return next?.startsWith("/") && !next.startsWith("//")
    ? next
    : ROUTES.profile;
}

export async function GET(request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next"));
  const supabase = await createClient();

  let error;

  if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else {
    error = new Error("The confirmation link is incomplete.");
  }

  if (error) {
    const loginUrl = new URL(ROUTES.login, url.origin);
    loginUrl.searchParams.set(
      "error",
      "That confirmation link is invalid or has expired."
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
