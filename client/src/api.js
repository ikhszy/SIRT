import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach token to every request
api.interceptors.request.use((config) => {
  const rawToken = localStorage.getItem("token");

  if (rawToken) {
    // Make sure we don't accidentally double-prefix
    const token = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
    config.headers.Authorization = token;
  }

  return config;
});

export default api;
