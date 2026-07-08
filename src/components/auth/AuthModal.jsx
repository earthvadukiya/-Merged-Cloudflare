import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faEnvelope,
  faLock,
  faUser,
  faEye,
  faEyeSlash,
  faCircleCheck,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "@/src/context/AuthContext";
import {
  signIn,
  signUp,
  validateCredentials,
  friendlyAuthError,
} from "@/src/lib/auth";
import { mergeLocalToCloud } from "@/src/lib/watchlist";

/**
 * Login / Register popup. Not mandatory — closing it just keeps you a guest.
 * Registration REQUIRES ticking the Terms-of-Service agreement box before the
 * submit button enables.
 */
export default function AuthModal() {
  const {
    authModalOpen,
    authModalMode,
    setAuthModalMode,
    closeAuth,
    authEnabled,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isRegister = authModalMode === "register";

  // Reset transient state whenever the modal opens or mode changes.
  useEffect(() => {
    if (authModalOpen) {
      setError("");
      setSuccess("");
      setBusy(false);
    }
  }, [authModalOpen, authModalMode]);

  // Lock body scroll while open + close on Esc.
  useEffect(() => {
    if (!authModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && closeAuth();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [authModalOpen, closeAuth]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const vErr = validateCredentials(email, password);
    if (vErr) return setError(vErr);
    if (isRegister && !agree) {
      return setError("You must agree to the Terms of Service to continue.");
    }

    setBusy(true);
    try {
      if (isRegister) {
        const { needsConfirmation, user } = await signUp({
          email,
          password,
          username,
        });
        if (needsConfirmation) {
          setSuccess(
            "Account created! Check your email and click the confirmation link, then log in."
          );
        } else {
          if (user?.id) await mergeLocalToCloud(user.id);
          setSuccess("Account created — you're in!");
          setTimeout(() => closeAuth(), 800);
        }
      } else {
        const { user } = await signIn({ email, password });
        if (user?.id) await mergeLocalToCloud(user.id);
        setSuccess("Welcome back!");
        setTimeout(() => closeAuth(), 600);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setAuthModalMode(isRegister ? "login" : "register");
    setError("");
    setSuccess("");
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={closeAuth}
      />

      {/* card */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-[#15101f] to-[#0a0a0f] shadow-[0_30px_120px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#a855f7]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[#7c3aed]/20 blur-3xl" />

        <button
          onClick={closeAuth}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="relative p-7 sm:p-8">
          {/* header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#7c3aed] flex items-center justify-center text-white font-black">
                O
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                OFF<span className="text-[#a855f7]">anime</span>
              </span>
            </div>
            <h2 className="text-2xl font-extrabold">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {isRegister
                ? "Sync your watch list & progress across all your devices."
                : "Log in to pick up right where you left off."}
            </p>
          </div>

          {!authEnabled && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm px-4 py-3">
              Login is not configured yet. Please add Supabase keys.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Field
                icon={faUser}
                type="text"
                placeholder="Username (optional)"
                value={username}
                onChange={setUsername}
                autoComplete="username"
              />
            )}

            <Field
              icon={faEnvelope}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />

            <div className="relative">
              <Field
                icon={faLock}
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={setPassword}
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} />
              </button>
            </div>

            {isRegister && (
              <label className="flex items-start gap-3 cursor-pointer select-none text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 accent-[#a855f7]"
                />
                <span>
                  I agree to the{" "}
                  <Link
                    to="/terms-of-service"
                    onClick={closeAuth}
                    className="text-[#c084fc] underline hover:text-[#d8b4fe]"
                  >
                    Terms of Service
                  </Link>{" "}
                  and understand that I log in{" "}
                  <span className="text-gray-200 font-medium">at my own risk</span>.
                </span>
              </label>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm px-4 py-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleCheck} />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !authEnabled || (isRegister && !agree)}
              className="w-full h-12 rounded-xl font-bold text-white bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] shadow-lg shadow-[#a855f7]/25 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {busy && <FontAwesomeIcon icon={faSpinner} spin />}
              {isRegister ? "Create account" : "Log in"}
            </button>
          </form>

          {/* switch */}
          <p className="text-center text-sm text-gray-400 mt-6">
            {isRegister ? "Already have an account?" : "New to OFFanime?"}{" "}
            <button
              onClick={switchMode}
              className="text-[#c084fc] font-semibold hover:text-[#d8b4fe]"
            >
              {isRegister ? "Log in" : "Create one"}
            </button>
          </p>

          <p className="text-center text-[11px] text-gray-600 mt-4">
            Logging in is optional — it just syncs your list across devices.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, type, placeholder, value, onChange, ...rest }) {
  return (
    <div className="relative">
      <FontAwesomeIcon
        icon={icon}
        className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 text-sm"
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 rounded-xl bg-white/[0.05] border border-white/10 pl-11 pr-4 text-white placeholder-gray-500 outline-none focus:border-[#a855f7]/60 focus:bg-white/[0.07] transition"
        {...rest}
      />
    </div>
  );
}
