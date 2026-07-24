import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

let isRefreshing = false;
let refreshFailed = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onRefreshed() {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      original.url.includes("/auth/logout") ||
      original.url.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const publicEndpoints = [
        "/admin/get-policy",
        "/mfa/setup",
        "/mfa/verify",
        "/mfa/setup/verify",
        "/user/setup-crypto",
      ];
      if (publicEndpoints.some((ep) => original.url.includes(ep))) {
        return Promise.reject(error);
      }
      if (original._retry || refreshFailed) {
        return Promise.reject(error);
      }

      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(() => {
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        await api.post("/auth/refresh");

        isRefreshing = false;
        refreshFailed = false;
        onRefreshed();
        return api(original);
      } catch (refreshError) {
        isRefreshing = false;
        refreshFailed = true;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
