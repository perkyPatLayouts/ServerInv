import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true // Enable cookies for CSRF token
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Add CSRF token from cookie to header
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='))
    ?.split('=')[1];

  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    // Handle password change required (403 with specific code)
    if (err.response?.status === 403 && err.response?.data?.code === "PASSWORD_CHANGE_REQUIRED") {
      window.location.href = "/change-password";
    }
    return Promise.reject(err);
  }
);

export default api;
