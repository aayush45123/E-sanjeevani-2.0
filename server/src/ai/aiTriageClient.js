import axios from "axios";

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000";

export const predictTriageDisease = async (message) => {
  return axios.post(`${PYTHON_AI_URL}/predict`, {
    message,
  });
};
