import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_ACCESS_COOKIE = "olf_admin_access";
const ADMIN_ACCESS_SECONDS = 15 * 60;

function getSecret() {
  const secret = process.env.ADMIN_ACCESS_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_ACCESS_SECRET must be set to a private value of at least 32 characters."
    );
  }

  return secret;
}

function getSessionId(claims) {
  return typeof claims?.session_id === "string" ? claims.session_id : "";
}

function signAccess(claims, expiresAt) {
  return createHmac("sha256", getSecret())
    .update(`${claims.sub}.${getSessionId(claims)}.${expiresAt}`)
    .digest("base64url");
}

function signaturesMatch(received, expected) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function hasVerifiedAdminAccess(claims) {
  if (!claims?.sub || !getSessionId(claims)) {
    return false;
  }

  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_ACCESS_COOKIE)?.value ?? "";
  const [expiresValue, receivedSignature, ...extraParts] = value.split(".");
  const expiresAt = Number(expiresValue);
  const now = Math.floor(Date.now() / 1000);

  if (
    extraParts.length ||
    !Number.isInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt > now + ADMIN_ACCESS_SECONDS ||
    !receivedSignature
  ) {
    return false;
  }

  return signaturesMatch(
    receivedSignature,
    signAccess(claims, expiresAt)
  );
}

export async function grantVerifiedAdminAccess(claims) {
  if (!claims?.sub || !getSessionId(claims)) {
    throw new Error("A valid Supabase session is required.");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_ACCESS_SECONDS;
  const signature = signAccess(claims, expiresAt);
  const cookieStore = await cookies();

  cookieStore.set(
    ADMIN_ACCESS_COOKIE,
    `${expiresAt}.${signature}`,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/admin",
      maxAge: ADMIN_ACCESS_SECONDS,
    }
  );
}
