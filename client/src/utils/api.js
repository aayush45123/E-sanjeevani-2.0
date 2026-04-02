// api.js
// Central API utility — all backend calls go through here.
// Automatically attaches the JWT from localStorage to every request.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Token Helpers ────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
}

// ── Core Request Function ────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = res.status;
    error.errors = data.errors || [];
    throw error;
  }

  return data;
}

// ── Auth APIs ────────────────────────────────────────────────
export const authApi = {
  signup: async (body) => {
    const data = await request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    });

    // Save token if returned
    if (data.token) setToken(data.token);

    return data;
  },

  login: async (body) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    // Save token
    if (data.token) setToken(data.token);

    return data;
  },

  logout: () => {
    removeToken();
  },

  me: () => request("/auth/me"),
};

// ── Patient Profile ──────────────────────────────────────────
export const profileApi = {
  getStatus: () => request("/patient/profile/status"),

  get: () => request("/patient/profile"),

  create: (body) =>
    request("/patient/profile", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (body) =>
    request("/patient/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

// ── Decode JWT locally (fallback — no network call) ──────────
export function decodeToken() {
  const token = getToken();
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}
