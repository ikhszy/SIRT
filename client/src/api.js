import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const rawToken = localStorage.getItem("token");

  if (rawToken) {
    const token = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
    config.headers.Authorization = token;
  }

  return config;
});

// Handle expired token with alert
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      localStorage.removeItem("token");
      alert("Sesi Anda telah berakhir. Silakan login kembali.");
      window.location.href = "/login?expired=true";
    }

    return Promise.reject(error);
  }
);

export default api;
