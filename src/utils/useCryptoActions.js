import { useCrypto } from "../context/CryptoContext";
import {
  initLogin,
  initRegistration,
  logout as logoutService,
} from "./cryptoUtils";

export const useCryptoActions = () => {
  const crypto = useCrypto();

  const register = async (masterPassword, username) => {
    return await initRegistration(masterPassword, username, crypto.setKeys);
  };

  const login = async (
    masterPassword,
    saltB64,
    publicKeyB64,
    privateKeyB64,
  ) => {
    return await initLogin(
      masterPassword,
      saltB64,
      publicKeyB64,
      privateKeyB64,
      crypto.setKeys,
    );
  };

  const logout = async () => {
    await logoutService(crypto.clear);
  };

  return {
    register,
    login,
    logout,
    crypto,
  };
};
