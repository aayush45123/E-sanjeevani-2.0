/**
 * auth.js — Centralised logout helper
 *
 * Always call this instead of manually clearing localStorage.
 * It revokes the server-side refresh token (so the old cookie cannot be
 * reused for silent renewal) before wiping UI state.
 */

import { authApi } from "./api";

/**
 * Full logout:
 *  1. Ask the server to revoke the refresh-token cookie.
 *  2. Clear every piece of auth-related UI state from localStorage.
 *  3. Dispatch "authChange" so every subscribed component re-evaluates.
 *  4. Redirect to the landing page.
 */
export const performLogout = async () => {
  try {
    await authApi.logout();
  } catch {
    // Server is unreachable or the cookie already expired — clear locally anyway
  }

  // Only UI-hint keys live in localStorage (never the raw token itself)
  localStorage.removeItem("userRole");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("doctorProfileCompleted");

  window.dispatchEvent(new Event("authChange"));
  window.location.href = "/";
};
