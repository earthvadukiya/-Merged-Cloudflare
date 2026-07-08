/**
 * Page-level popup / redirect blocker.
 *
 * Many embedded players refuse to run inside a sandboxed iframe
 * ("Sandboxed our player is not allowed"). To still block their popunder /
 * redirect ads WITHOUT a sandbox, we guard the parent page itself:
 *
 *   1. window.open(...) is intercepted — ad windows are denied, while
 *      genuine same-site / fullscreen calls are allowed.
 *   2. Forced top-level navigations to unknown ad domains (the player trying
 *      to replace OFFANIME with an ad page) are cancelled.
 *
 * The guard is installed once and can be toggled on/off so the user's
 * Ad-Block switch controls it.
 */

let installed = false;
let active = false;
let blockedCount = 0;
let originalOpen = null;

// Hosts we always trust (our own site + known good embed targets).
const ALLOWED_HOST_PARTS = [
  typeof location !== "undefined" ? location.hostname : "",
  "youtube.com",
  "youtu.be",
  "vimeo.com",
].filter(Boolean);

function isTrusted(url) {
  if (!url) return true; // window.open(undefined) => about:blank popup, allow
  try {
    const u = new URL(url, location.href);
    if (u.protocol === "about:" || u.protocol === "blob:") return true;
    if (u.protocol === "mailto:" || u.protocol === "tel:") return true;
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return ALLOWED_HOST_PARTS.some((h) => u.hostname.endsWith(h));
  } catch {
    return false;
  }
}

export function getBlockedCount() {
  return blockedCount;
}

export function installPopupGuard() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  originalOpen = window.open.bind(window);

  // 1) Intercept window.open — block untrusted popups when active.
  window.open = function guardedOpen(url, target, features) {
    if (active && !isTrusted(url)) {
      blockedCount += 1;
      // Return a harmless stub so callers that read the handle don't crash.
      return {
        closed: true,
        close() {},
        focus() {},
        blur() {},
        location: { href: "", replace() {}, assign() {} },
        document: { write() {}, close() {} },
      };
    }
    return originalOpen(url, target, features);
  };

  // 2) Block forced top-navigation to ad domains (capture phase).
  window.addEventListener(
    "click",
    (e) => {
      if (!active) return;
      const a = e.target?.closest?.("a[href]");
      // Links the app explicitly marks as user-intended (e.g. our Download
      // page source links) must NEVER be blocked.
      if (a && a.dataset && a.dataset.allowPopup === "true") return;
      if (a && a.target === "_blank" && !isTrusted(a.href)) {
        e.preventDefault();
        e.stopPropagation();
        blockedCount += 1;
      }
    },
    true
  );
}

export function setPopupGuardActive(on) {
  active = !!on;
}

export function isPopupGuardActive() {
  return active;
}
