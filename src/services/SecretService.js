import api from "../api/api";

export const createSecret = async (secretData) => {
  const response = await api.post("/secrets/create", secretData);
  return response.data;
};

export const getMySecrets = async () => {
  const response = await api.get("/secrets/get");
  return response.data;
};

export const getSharedWithMe = async () => {
  const response = await api.get("/secrets/shared");
  return response.data;
};

export const getSecretById = async (id) => {
  const response = await api.get(`/secrets/get/${id}`);
  return response.data;
};

export const updateSecret = async (id, secretData) => {
  const response = await api.put(`/secrets/update/${id}`, secretData);
  return response.data;
};

export const deleteSecret = async (id) => {
  await api.delete(`/secrets/delete/${id}`);
};

export const shareSecret = async (
  secretId,
  recipientUsername,
  encryptedAesKeyB64,
) => {
  await api.post(`/secrets/share/${secretId}`, {
    recipientUsername,
    encryptedAesKeyB64,
  });
};

// Dohvatanje javnog ključa korisnika (za dijeljenje)
export const getUserPublicKey = async (username) => {
  const response = await api.get(`/user/${username}/pub-key`);
  return response.data; // { username, publicKey }
};

export const adminGetAllUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const adminLockUser = async (uuid) => {
  await api.put(`/admin/users/${uuid}/lock`);
};

export const adminUnlockUser = async (uuid) => {
  await api.put(`/admin/users/${uuid}/unlock`);
};

export const getSecurityPolicy = async () => {
  const response = await api.get("/admin/get-policy");
  return response.data;
};

export const updateSecurityPolicy = async (policyData) => {
  const response = await api.put("/admin/update-policy", policyData);
  return response.data;
};
