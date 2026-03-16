import axios from "axios";


const api = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
    withCredentials: true
});

let isRefreshing = false;
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

        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh(() => {
                        resolve(api(original));
                    });
                });
            }

            original._retry = true;
            isRefreshing = true;


            try {
                await api.post("/refresh");

                isRefreshing = false;
                onRefreshed();
                return api(original);
            } catch (refreshError) {
                isRefreshing = false;
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;