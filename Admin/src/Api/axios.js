
import axios from "axios";

const api = axios.create({
  baseURL: "https://medical-counselling-1.onrender.com",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    console.log("Token available:", !!token);
    console.log("Request URL:", config.url);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
