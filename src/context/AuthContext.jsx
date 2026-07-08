import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getSession,
  onAuthChange,
  signOut as doSignOut,
  supabaseEnabled,
} from "@/src/lib/auth";

const AuthContext = createContext(null);

/**
 * Global auth state. Loads the current Supabase session on mount and keeps it
 * in sync (login / logout / token refresh) via onAuthStateChange. Also exposes
 * a global "open the login popup" trigger so any component (navbar, watch page,
 * dashboard guard) can request the modal without prop-drilling.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login"); // "login" | "register"

  useEffect(() => {
    let alive = true;

    if (!supabaseEnabled) {
      setLoading(false);
      return;
    }

    getSession()
      .then((s) => {
        if (alive) setSession(s);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    const unsub = onAuthChange((s) => {
      if (alive) setSession(s);
    });

    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const openAuth = useCallback((mode = "login") => {
    setAuthModalMode(mode === "register" ? "register" : "login");
    setAuthModalOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthModalOpen(false), []);

  const signOut = useCallback(async () => {
    await doSignOut();
    setSession(null);
  }, []);

  const user = session?.user || null;
  const displayName =
    user?.user_metadata?.username ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "User";

  const value = {
    session,
    user,
    displayName,
    loading,
    isAuthed: Boolean(user),
    authEnabled: supabaseEnabled,
    authModalOpen,
    authModalMode,
    openAuth,
    closeAuth,
    setAuthModalMode,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
