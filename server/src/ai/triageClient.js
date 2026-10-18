import axios from "axios";

const rawPythonUrl = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000";
const PYTHON_AI_URL = rawPythonUrl.replace(/\/$/, "");

/**
 * Sends a unified triage request to the Python ML microservice.
 * @param {Object} payload { symptoms: Object|Array, category?: string, red_flags?: Object|Array }
 * @param {number} timeoutMs
 */
export const predictUnifiedTriage = async (payload, timeoutMs = 4000) => {
  return axios.post(`${PYTHON_AI_URL}/predict-triage`, payload, {
    timeout: timeoutMs,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * Checks health of all 5 category models in the Python microservice.
 */
export const getTriageHealth = async (timeoutMs = 2500) => {
  return axios.get(`${PYTHON_AI_URL}/triage-health`, {
    timeout: timeoutMs,
  });
};

/**
 * Gets category metadata (features, classes, red flags) from the Python microservice.
 */
export const getTriageCategories = async (timeoutMs = 3000) => {
  return axios.get(`${PYTHON_AI_URL}/categories`, {
    timeout: timeoutMs,
  });
};
