import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("authChange"));
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  register: (data) => apiClient.post("/auth/register", data),
  signup: (data) => apiClient.post("/auth/register", data), // ✅ Alias
  login: (data) => apiClient.post("/auth/login", data),
  logout: () => apiClient.post("/auth/logout"),
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
  getDoctorAvailableSlots: (params) =>
    apiClient.get("/consultations/doctor-slots", { params }),
  getDoctorProfile: (id) => apiClient.get(`/consultations/doctors/${id}`),
  createConsultation: (data) => apiClient.post("/consultations", data),
  updateConsultation: (id, data) => apiClient.put(`/consultations/${id}`, data),
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

export default apiClient;
