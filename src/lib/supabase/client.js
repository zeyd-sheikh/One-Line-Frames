"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnvironment } from "./env";

let browserClient;

export function createClient() {
  if (!browserClient) {
    const { url, publishableKey } = getSupabaseEnvironment();
    browserClient = createBrowserClient(url, publishableKey);
  }

  return browserClient;
}
