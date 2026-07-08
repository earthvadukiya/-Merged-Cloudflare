// Authentication helpers (thin wrapper around Supabase Auth).
//
// SECURITY NOTES
//  * We NEVER store raw passwords ourselves. Supabase Auth hashes passwords with
//    bcrypt server-side; the client only ever sends them over HTTPS to Supabase.
//  * The client only ever holds the user's session JWT (short-lived) + refresh
//    token, managed by supabase-js. We never touch the service_role key here.
//  * All user rows (progress / watch-later) are protected by Row-Level Security
//    so one user can never read or write another user's data, even with the
//    public anon key.

import { supabase, supabaseEnabled } from "./supabase";

export { supabaseEnabled };

/** Basic client-side validation so we give nice errors before hitting the API. */
export function validateCredentials(email, password) {
  const e = String(email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return "Please enter a valid email address.";
  }
  if (String(password || "").length < 6) {
    return "Password must be at least 6 characters.";
  }
  return null;
}

/**
 * Create a new account. Returns { user, session, needsConfirmation }.
 * If the project has email-confirmation ON, session will be null and the user
 * must confirm via the email link before they can sign in.
 */
export async function signUp({ email, password, username }) {
  if (!supabase) throw new Error("Auth is not configured.");
  const { data, error } = await supabase.auth.signUp({
    email: String(email).trim(),
    password,
    options: {
      data: { username: String(username || "").trim() || null },
      emailRedirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/home` : undefined,
    },
  });
  if (error) throw error;
  return {
    user: data.user,
    session: data.session,
    needsConfirmation: !data.session, // no session => email confirmation required
  };
}

/** Sign in with email + password. Returns { user, session }. */
export async function signIn({ email, password }) {
  if (!supabase) throw new Error("Auth is not configured.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email).trim(),
    password,
  });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

/** Sign the current user out (clears the local session). */
export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Get the current session (or null). */
export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthChange(cb) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session);
  });
  return () => data?.subscription?.unsubscribe?.();
}

/** Turn a Supabase auth error into a friendly message. */
export function friendlyAuthError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  if (msg.includes("invalid login")) return "Wrong email or password.";
  if (msg.includes("already registered") || msg.includes("already been registered"))
    return "An account with this email already exists. Try logging in.";
  if (msg.includes("email not confirmed"))
    return "Please confirm your email first — check your inbox.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("password")) return "Password must be at least 6 characters.";
  return err?.message || "Something went wrong. Please try again.";
}
