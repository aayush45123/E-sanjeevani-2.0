/**
 * auth.js — Centralised logout helper
 *
 * Always call this instead of manually clearing localStorage.
 * It revokes the server-side refresh token (so the old cookie cannot be
 * reused for silent renewal) before wiping UI state.
 */

import { authApi, clearAccessToken } from "./api";

/**
 * Full logout:
 *  1. Ask the server to revoke the refresh-token cookie.
 *  2. Clear in-memory access token.
 *  3. Clear every piece of auth-related UI state from localStorage.
 *  4. Dispatch "authChange" so every subscribed component re-evaluates.
 *  5. Redirect to the landing page.
 */
export const performLogout = async () => {
  try {
    await authApi.logout();
  } catch {
    // Server is unreachable or the cookie already expired — clear locally anyway
  }

  // Clear in-memory token
  clearAccessToken();

  // Only UI-hint keys live in localStorage (never the raw token itself)
  localStorage.removeItem("userRole");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("doctorProfileCompleted");
  localStorage.removeItem("access_token_local");
  localStorage.removeItem("refresh_token_local");

  window.dispatchEvent(new Event("authChange"));
  window.location.href = "/";
};
