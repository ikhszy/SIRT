import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const rawToken = localStorage.getItem("token");
  if (rawToken) {
    const token = rawToken.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}`;
    config.headers.Authorization = token;
  }
  return config;
});

// Handle 403: dispatch custom event
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      console.warn("403 detected - dispatching sessionExpired");

      // ✅ Prevent duplicate dispatch
      if (!window.__sessionExpiredDispatched) {
        window.__sessionExpiredDispatched = true;
        window.dispatchEvent(new CustomEvent("sessionExpired"));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
