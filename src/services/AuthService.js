import api from "../api/api";

export const register = async (data) => {
  const response = await api.post("/user/register", data);
  return response.data;
};

export const login = async (username, password) => {
  const response = await api.post("/auth/login", { username, password });

  return response.data; //username
};

export const refreshToken = async () => {
  return await api.post("/auth/refresh");
};

//verifikacija koda
export const verifyMfa = async (tempToken, code) => {
  const response = await api.post("/mfa/verify", { tempToken, code });

  return response.data; //roles
};

//postavljanje QR koda za skeniranje
export const setupMfa = async (tempToken) => {
  const response = await api.post("/mfa/setup", { tempToken });

  return response.data;
};

//verifikacija postavljenog QR koda za povezivanje sa autentikatorskom aplikacijom
export const verifySetupMfa = async (tempToken, code) => {
  return api.post("/mfa/setup/verify", { tempToken, code });
};

export const logout = async () => {
  return api.post("/auth/logout");
};

export const validate = async () => {
  return api.get("/auth/validate");
};

export const getOidc = async () => {
  return api.get("/auth/oidc");
};
