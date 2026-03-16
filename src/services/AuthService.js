import api from "../api/api";

export const login = async (username, password) => {
    const response = await api.post("/auth/login", { username, password });
    console.log("Full response:", response);
    console.log("Response data:", response.data);
    console.log("Roles from response:", response.data.roles);

    return response.data.roles;
}

export const logout = async () => {
    return api.post("/auth/logout");
}

export const validate = async () => {
    return api.get("/auth/validate");
}