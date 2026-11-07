import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://e-sanjeevani-2-0.onrender.com/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const getFullFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

// ─── In-Memory Access Token (REQ-SEC-AUTH-01, REQ-SEC-AUTH-02) ───────────────
let accessTokenInMemory = null;

export const getAccessToken = () => accessTokenInMemory;
export const setAccessToken = (token) => {
  accessTokenInMemory = token || null;
};
export const clearAccessToken = () => {
  accessTokenInMemory = null;
};

// Backward compatibility wrappers
export const getLocalToken = () => accessTokenInMemory;
export const setLocalToken = (token) => setAccessToken(token);
export const clearLocalToken = () => clearAccessToken();
export const getRefreshToken = () => null; // Refresh token lives purely in httpOnly cookie
export const setRefreshToken = () => {};
export const clearRefreshToken = () => {};

// ─── Request interceptor – attach memory token as Bearer header ──────────────
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
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

// Response interceptor for error handling & silent cookie refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
    const isLoginRequest =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      !isLoginRequest
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
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
        const newAccessToken = refreshRes.data?.accessToken;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
        }
        isRefreshing = false;
        processQueue(null, newAccessToken);
        if (newAccessToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);

        // Full logout state clearing
        clearAccessToken();
        localStorage.removeItem("userRole");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("doctorProfileCompleted");
        localStorage.removeItem("access_token_local");
        localStorage.removeItem("refresh_token_local");

        window.dispatchEvent(new Event("authChange"));
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
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    return res;
  },
  signup: async (data) => {
    const res = await apiClient.post("/auth/register", data);
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    return res;
  },
  login: async (data) => {
    const res = await apiClient.post("/auth/login", data);
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    return res;
  },
  logout: async () => {
    try {
      return await apiClient.post("/auth/logout");
    } finally {
      clearAccessToken();
    }
  },
  refresh: async () => {
    const res = await apiClient.post("/auth/refresh");
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    return res;
  },
  me: () => apiClient.get("/auth/me"),
  updateProfile: (data) => apiClient.put("/auth/patient/update", data),
  completePatientProfile: (data) =>
    apiClient.put("/auth/patient/complete-profile", data),
};

// Consultations API
export const consultationApi = {
  getMyConsultations: (params) =>
    apiClient.get("/consultations/my-consultations", { params }),

  getDoctorConsultations: () =>
    apiClient.get("/consultations/doctor-dashboard"),

  getConsultationDetails: (id) => apiClient.get(`/consultations/${id}`),

  getAvailableDoctors: (params) =>
    apiClient.get("/consultations/doctors/available", { params }),

  getSpecialties: () =>
    apiClient.get("/consultations/specialties"),

  getDoctorsNearMe: (params) =>
    apiClient.get("/consultations/doctors/nearby", { params }),

  checkDoctorProfileStatus: () => apiClient.get("/doctor-profile/status"),

  getDoctorAvailableSlots: (params) =>
    apiClient.get("/consultations/doctor-slots", { params }),

  getDoctorProfile: (id) => apiClient.get(`/consultations/doctors/${id}`),

  createConsultation: (data) => apiClient.post("/consultations/book", data),

  updateConsultation: (id, data) => apiClient.put(`/consultations/${id}`, data),

  updateConsultationStatus: (consultationId, data) =>
    apiClient.patch(`/consultations/${consultationId}/status`, data),

  cancelConsultation: (id, data) =>
    apiClient.post(`/consultations/${id}/cancel`, data),

  getStats: () => apiClient.get("/consultations/stats"),
};

export const doctorProfileApi = {
  createProfile: (data) => apiClient.post("/doctor-profile", data),
  updateProfile: (data) => apiClient.post("/doctor-profile", data),
  getProfile: () => apiClient.get("/doctor-profile/me"),
  checkProfileStatus: () => apiClient.get("/doctor-profile/status"),
};

// Doctor Availability API
export const doctorAvailabilityApi = {
  createAvailability: (data) => apiClient.post("/doctor-availability", data),
  getMySlots: () => apiClient.get("/doctor-availability/my-slots"),
  getDoctorSlots: (doctorId, date) =>
    apiClient.get(`/doctor-availability/slots/${doctorId}`, {
      params: { date },
    }),
  deleteAvailability: (id) => apiClient.delete(`/doctor-availability/${id}`),
  deleteSlot: (slotId) => apiClient.delete(`/doctor-availability/slots/${slotId}`),
};

// Doctor Assistant API
export const doctorAssistantApi = {
  getData: (consultationId) => apiClient.get(`/doctor-assistant/data/${consultationId}`),
  chat: (data) => apiClient.post("/doctor-assistant/chat", data),
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
  downloadAttachment: (attachmentId) =>
    apiClient.get(`/medical-records/attachments/${attachmentId}`, { responseType: "blob" }),
  issuePrescription: (data) =>
    apiClient.post("/medical-records/issue-prescription", data),
};

// Prescription API
export const prescriptionApi = {
  createPrescription: (data) => apiClient.post("/prescriptions", data),
  getPrescriptionById: (id) => apiClient.get(`/prescriptions/${id}`),
  downloadPrescriptionPdf: (id) =>
    apiClient.get(`/prescriptions/${id}/pdf`, { responseType: "blob" }),
  getPatientPrescriptions: (patientId) => apiClient.get(`/prescriptions/patient/${patientId}`),
  getDoctorPatientPrescriptions: (patientId) => apiClient.get(`/prescriptions/doctor-patient/${patientId}`),
  finalizePrescription: (id) => apiClient.patch(`/prescriptions/${id}/finalize`),
  amendPrescription: (id, data) => apiClient.post(`/prescriptions/${id}/amend`, data),
  discontinueMedication: (prescriptionId, itemId) =>
    apiClient.patch(`/prescriptions/${prescriptionId}/items/${itemId}/discontinue`),
};

// Patient History & Longitudinal Clinical Intelligence API
export const patientHistoryApi = {
  getDoctorPatientHistory: (doctorId, patientId) =>
    apiClient.get(`/patient-history/doctors/${doctorId}/patients/${patientId}/history`),

  getDoctorPatientAnalytics: (doctorId, patientId) =>
    apiClient.get(`/patient-history/doctors/${doctorId}/patients/${patientId}/analytics`),

  getPatientClinicalRecords: (patientId) =>
    apiClient.get(`/patient-history/patients/${patientId}/clinical-records`),

  addClinicalRecord: (patientId, formData) =>
    apiClient.post(`/patient-history/patients/${patientId}/clinical-records`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getClinicalRecordById: (id) =>
    apiClient.get(`/patient-history/clinical-records/${id}`),

  downloadAttachment: (attachmentId) =>
    apiClient.get(`/patient-history/attachments/${attachmentId}`, { responseType: "blob" }),

  getLongitudinalIntelligence: (patientId, currentComplaint = "") =>
    apiClient.get(`/patient-history/patients/${patientId}/longitudinal-intelligence`, {
      params: currentComplaint ? { currentComplaint } : {},
    }),

  recordHealthMetric: (patientId, data) =>
    apiClient.post(`/patient-history/patients/${patientId}/health-metrics`, data),

  getHealthMetrics: (patientId) =>
    apiClient.get(`/patient-history/patients/${patientId}/health-metrics`),

  regenerateAiSummary: (patientId, data = {}) =>
    apiClient.post(`/patient-history/patients/${patientId}/generate-summary`, data),
};

export const triggerBlobDownload = (blobData, filename = "document.pdf") => {
  const blob = new Blob([blobData], { type: blobData.type || "application/octet-stream" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export const viewBlobInNewTab = (blobData) => {
  const blob = new Blob([blobData], { type: blobData.type || "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => window.URL.revokeObjectURL(url), 60000);
};

// Analytics API
export const analyticsApi = {
  getDoctorAnalytics: (params) => apiClient.get("/analytics/doctor", { params }),
  getDoctorOverview: () => apiClient.get("/analytics/doctor/overview"),
  getDoctorFollowUps: () => apiClient.get("/analytics/doctor/follow-ups"),
  updateFollowUpStatus: (consultationId, status) =>
    apiClient.patch(`/analytics/doctor/follow-ups/${consultationId}/status`, { status }),
};

// Feedback & Dynamic Doctor Ratings API
export const feedbackApi = {
  submitFeedback: (data) => apiClient.post("/feedback/submit", data),
  checkFeedback: (consultationId) => apiClient.get(`/feedback/check/${consultationId}`),
  getDoctorRating: (doctorId) => apiClient.get(`/feedback/doctor/${doctorId}`),
};

export default apiClient;
