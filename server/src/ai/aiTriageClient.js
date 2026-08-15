import axios from "axios";

const rawPythonUrl = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000";
const PYTHON_AI_URL = rawPythonUrl.replace(/\/$/, "");

export const predictTriageDisease = async (message) => {
  return axios.post(`${PYTHON_AI_URL}/predict`, {
    message,
  });
};
