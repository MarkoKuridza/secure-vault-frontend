import api from "../api/api";

export const getCryptoData = async () => {
  const response = await api.get("/user/crypto");
  return response.data;
};

//ovo mi postavlja javni kljuc i salt u bazu
export const setupCrypto = async (tempToken, { publicKey, salt }) => {
  const response = await api.post("/user/setup-crypto", {
    tempToken,
    publicKey,
    salt,
  });
  return response.data;
};
