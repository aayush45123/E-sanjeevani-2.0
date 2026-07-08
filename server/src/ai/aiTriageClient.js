import axios from "axios";

export const predictTriageDisease = async (message) => {
  return axios.post("http://127.0.0.1:8000/predict", {
    message,
  });
};
