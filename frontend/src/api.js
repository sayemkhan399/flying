import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "").replace(/\/+$/, ""),
  withCredentials: true,
  timeout: 65000,
});

export default api;
