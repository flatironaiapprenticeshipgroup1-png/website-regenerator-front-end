"use client";

import { createClient } from "./client";
import { clearSignedOut } from "./signedOutFlag";

export async function ensureAnonymousSession() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  clearSignedOut();
  return data.session;
}
