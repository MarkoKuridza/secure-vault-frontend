import { createContext, useContext, useRef } from "react";

const CryptoContext = createContext(null);

export function CryptoProvider({ children }) {
  const encryptionKeyRef = useRef(null);
  const privateKeyRef = useRef(null);
  const publicKeyRef = useRef(null);

  const setKeys = (encryptionKey, privateKey, publicKey) => {
    encryptionKeyRef.current = encryptionKey;
    privateKeyRef.current = privateKey;
    publicKeyRef.current = publicKey;
  };

  const getEncryptionKey = () => encryptionKeyRef.current;
  const getPrivateKey = () => privateKeyRef.current;
  const getPublicKey = () => publicKeyRef.current;

  const isInitialized = () =>
    encryptionKeyRef.current !== null && privateKeyRef.current !== null;

  const clear = () => {
    encryptionKeyRef.current = null;
    privateKeyRef.current = null;
    publicKeyRef.current = null;
  };

  return (
    <CryptoContext.Provider
      value={{
        setKeys,
        getEncryptionKey,
        getPrivateKey,
        getPublicKey,
        isInitialized,
        clear,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export const useCrypto = () => useContext(CryptoContext);
