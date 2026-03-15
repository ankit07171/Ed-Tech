import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:7171",
});

// Attach token from localStorage to every request
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
