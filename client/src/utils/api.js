import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ─── Token helpers (localStorage is port-isolated on localhost) ───────────────
const TOKEN_KEY = "access_token_local";
const REFRESH_TOKEN_KEY = "refresh_token_local";

export const getLocalToken = () => localStorage.getItem(TOKEN_KEY);
export const setLocalToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
};
export const clearLocalToken = () => localStorage.removeItem(TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token) => {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
};
export const clearRefreshToken = () => localStorage.removeItem(REFRESH_TOKEN_KEY);

// ─── Request interceptor – attach tokens as Bearer / X-Refresh-Token headers ──
apiClient.interceptors.request.use((config) => {
  const token = getLocalToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    config.headers = config.headers || {};
    config.headers["x-refresh-token"] = refreshToken;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 Unauthorized and we haven't retried yet
    // Do NOT retry if the request itself failed to refresh the token, or was login/register
    const isRefreshRequest = originalRequest.url === "/auth/refresh";
    const isLoginRequest = originalRequest.url === "/auth/login" || originalRequest.url === "/auth/register";

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest && !isLoginRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await apiClient.post("/auth/refresh");
        // Save new tokens from refresh response
        if (refreshRes.data?.accessToken) {
          setLocalToken(refreshRes.data.accessToken);
        }
        if (refreshRes.data?.refreshToken) {
          setRefreshToken(refreshRes.data.refreshToken);
        }
        isRefreshing = false;
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        
        // Full logout state clearing
        clearLocalToken();
        clearRefreshToken();
        localStorage.removeItem("userRole");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("doctorProfileCompleted");
        
        window.dispatchEvent(new Event("authChange"));
        window.location.href = "/auth";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  register: async (data) => {
    const res = await apiClient.post("/auth/register", data);
    if (res.data?.accessToken) setLocalToken(res.data.accessToken);
    if (res.data?.refreshToken) setRefreshToken(res.data.refreshToken);
    return res;
  },
  signup: async (data) => {
    const res = await apiClient.post("/auth/register", data);
    if (res.data?.accessToken) setLocalToken(res.data.accessToken);
    if (res.data?.refreshToken) setRefreshToken(res.data.refreshToken);
    return res;
  },
  login: async (data) => {
    const res = await apiClient.post("/auth/login", data);
    if (res.data?.accessToken) setLocalToken(res.data.accessToken);
    if (res.data?.refreshToken) setRefreshToken(res.data.refreshToken);
    return res;
  },
  logout: async () => {
    try {
      return await apiClient.post("/auth/logout");
    } finally {
      clearLocalToken();
      clearRefreshToken();
    }
  },
  refresh: async () => {
    const res = await apiClient.post("/auth/refresh");
    if (res.data?.accessToken) setLocalToken(res.data.accessToken);
    if (res.data?.refreshToken) setRefreshToken(res.data.refreshToken);
    return res;
  },
  me: () => apiClient.get("/auth/me"),
  updateProfile: (data) => apiClient.put("/auth/patient/update", data),
  completePatientProfile: (data) =>
    apiClient.put("/auth/patient/complete-profile", data),
};

// Consultations API
// src/utils/api.js — only the consultationApi object needs to change

export const consultationApi = {
  getMyConsultations: (params) =>
    apiClient.get("/consultations/my-consultations", { params }),

  getDoctorConsultations: () =>
    apiClient.get("/consultations/doctor-dashboard"),

  getConsultationDetails: (id) => apiClient.get(`/consultations/${id}`),

  getAvailableDoctors: (params) =>
    apiClient.get("/consultations/doctors/available", { params }),

  getDoctorsNearMe: (params) =>
    apiClient.get("/consultations/doctors/nearby", { params }),

  checkDoctorProfileStatus: () => apiClient.get("/doctor-profile/status"),

  getDoctorAvailableSlots: (params) =>
    apiClient.get("/consultations/doctor-slots", { params }),

  getDoctorProfile: (id) => apiClient.get(`/consultations/doctors/${id}`),

  // ✅ FIX: was POST /consultations, must be POST /consultations/book
  createConsultation: (data) => apiClient.post("/consultations/book", data),

  updateConsultation: (id, data) => apiClient.put(`/consultations/${id}`, data),

  updateConsultationStatus: (consultationId, data) =>
    apiClient.patch(`/consultations/${consultationId}/status`, data),

  cancelConsultation: (id, data) =>
    apiClient.post(`/consultations/${id}/cancel`, data),

  getStats: () => apiClient.get("/consultations/stats"),
};
export const doctorProfileApi = {
  /*
  CREATE / UPDATE PROFILE
  POST /api/doctor-profile
  */
  createProfile: (data) => apiClient.post("/doctor-profile", data),

  /*
  UPDATE PROFILE
  POST /api/doctor-profile
  */
  updateProfile: (data) => apiClient.post("/doctor-profile", data),

  /*
  GET LOGGED IN DOCTOR PROFILE
  GET /api/doctor-profile/me
  */
  getProfile: () => apiClient.get("/doctor-profile/me"),

  /*
  CHECK PROFILE STATUS
  GET /api/doctor-profile/status
  */
  checkProfileStatus: () => apiClient.get("/doctor-profile/status"),
};

// Doctor Availability API
export const doctorAvailabilityApi = {
  /*
  CREATE DOCTOR AVAILABILITY
  POST /api/doctor-availability
  */
  createAvailability: (data) => apiClient.post("/doctor-availability", data),

  /*
  GET DOCTOR OWN AVAILABILITY
  GET /api/doctor-availability/my-slots
  */
  getMySlots: () => apiClient.get("/doctor-availability/my-slots"),

  /*
  GET DOCTOR'S AVAILABLE SLOTS FOR A SPECIFIC DATE (for patient booking)
  GET /api/doctor-availability/slots/:doctorId?date=2026-05-01
  */
  getDoctorSlots: (doctorId, date) =>
    apiClient.get(`/doctor-availability/slots/${doctorId}`, {
      params: { date },
    }),

  /*
  DELETE DOCTOR AVAILABILITY
  DELETE /api/doctor-availability/:id
  */
  deleteAvailability: (id) => apiClient.delete(`/doctor-availability/${id}`),
};

// Medical Records & Digital Prescription API
export const medicalRecordApi = {
  uploadPatientRecord: (formData) =>
    apiClient.post("/medical-records/patient-upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getMyRecords: () => apiClient.get("/medical-records/my-records"),

  getRecordById: (id) => apiClient.get(`/medical-records/${id}`),

  getRecordByConsultation: (consultationId) =>
    apiClient.get(`/medical-records/consultation/${consultationId}`),

  issuePrescription: (data) =>
    apiClient.post("/medical-records/issue-prescription", data),
};


// Analytics API
export const analyticsApi = {
  getDoctorAnalytics: () => apiClient.get("/analytics/doctor"),
};

export default apiClient;
