import axios from "axios";


const api = axios.create({
  baseURL: "https://medical-counselling-nvka.vercel.app",
  headers: {
    // "Content-Type": "application/json",
  },
});
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);
export default api;
