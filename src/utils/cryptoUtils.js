import { downloadPrivateKeyFile, pemToPrivateKeyBuffer } from "./pemUtils";

function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

function generateIv() {
  return crypto.getRandomValues(new Uint8Array(12));
}

function encodeText(text) {
  return new TextEncoder().encode(text);
}

function decodeText(buffer) {
  return new TextDecoder().decode(buffer);
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const DB_NAME = "SecureVaultDB";
const DB_VERSION = 1;
const STORE_NAME = "privateKey";
const KEY_RECORD_ID = "userPrivateKey";

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const storePrivateKeyInDB = async (encryptedPrivateKeyB64, ivB64) => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const request = store.put({
      id: KEY_RECORD_ID,
      encryptedPrivateKeyB64,
      ivB64,
    });

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

export const loadPrivateKeyFromDB = async (encryptionKey) => {
  const db = await openDatabase();

  const record = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(KEY_RECORD_ID);

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });

  if (!record) {
    throw new Error("Private key not found");
  }

  const privateKeyBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToArrayBuffer(record.ivB64) },
    encryptionKey,
    base64ToArrayBuffer(record.encryptedPrivateKeyB64),
  );

  return crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"],
  );
};

export const deletePrivateKeyFromDB = async () => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(KEY_RECORD_ID);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = (event) => reject(event.target.error);
    tx.onabort = (event) => reject(event.target.error);
  });
};

export const privateKeyExistInDB = async () => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.count(KEY_RECORD_ID);

    request.onsuccess = (event) => resolve(event.target.result > 0);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const importPrivateKeyFromFile = async (file, encryptionKey) => {
  const pem = await file.text();
  const privateKeyBuffer = pemToPrivateKeyBuffer(pem);

  const iv = generateIv();
  const encryptedPrivateKey = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    encryptionKey,
    privateKeyBuffer,
  );

  await storePrivateKeyInDB(
    arrayBufferToBase64(encryptedPrivateKey),
    arrayBufferToBase64(iv),
  );

  return crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"],
  );
};

//derivacija kljuca za enkripciju
export const derivedSecretKey = async (masterPassword, saltB64) => {
  const masterPasswordRawKey = await crypto.subtle.importKey(
    "raw",
    encodeText(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: base64ToArrayBuffer(saltB64),
      iterations: 100000,
      hash: "SHA-256",
    },
    masterPasswordRawKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );

  return derivedKey;
};

//generisanje para kljuceva za enkripciju (RSA)
export const generateRsaKeyPair = async (username) => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );

  const publicKeyBuffer = await crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey,
  );
  const privateKeyBuffer = await crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey,
  );

  downloadPrivateKeyFile(privateKeyBuffer, username);

  return {
    publicKeyB64: arrayBufferToBase64(publicKeyBuffer),
    privateKey: keyPair.privateKey,
  };
};

export const importPublicKey = async (publicKeyB64) => {
  return crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(publicKeyB64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
};

//enkriptija
export const encryptText = async (text, ownerPublicKey) => {
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const iv = generateIv();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encodeText(text),
  );

  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const encryptedAesKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    ownerPublicKey,
    rawAesKey,
  );

  return {
    encryptedTextB64: arrayBufferToBase64(encrypted),
    ivB64: arrayBufferToBase64(iv),
    encryptedAesKeyB64: arrayBufferToBase64(encryptedAesKey),
  };
};

//dekripcija
export const decryptText = async (encryptedSecret, ownerPrivateKey) => {
  const rawAesKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    ownerPrivateKey,
    base64ToArrayBuffer(encryptedSecret.encryptedAesKeyB64),
  );
  const aesKey = await crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToArrayBuffer(encryptedSecret.ivB64) },
    aesKey,
    base64ToArrayBuffer(encryptedSecret.encryptedTextB64),
  );

  return decodeText(decrypted);
};

export const shareSecret = async (
  encryptedSecret,
  ownerPrivateKey,
  recipientPublicKey,
) => {
  const rawAesKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    ownerPrivateKey,
    base64ToArrayBuffer(encryptedSecret.encryptedAesKeyB64),
  );

  const keyForRecipient = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    rawAesKey,
  );

  return {
    encryptedAesKeyB64: arrayBufferToBase64(keyForRecipient),
  };
};

//validacija upload-ovanog privatnog kljuca pri loginu
export const validateKeyPair = async (privateKey, publicKey) => {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const encrypted = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      challenge,
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encrypted,
    );

    const original = Array.from(challenge);
    const result = Array.from(new Uint8Array(decrypted));

    if (original.length !== result.length) {
      return false;
    }

    for (let i = 0; i < original.length; i++) {
      if (original[i] !== result[i]) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
};

export const initRegistration = async (masterPassword, username, setKeys) => {
  const saltB64 = arrayBufferToBase64(generateSalt());
  const encryptionKey = await derivedSecretKey(masterPassword, saltB64);

  const { publicKeyB64, privateKey } = await generateRsaKeyPair(username);

  const publicKey = await importPublicKey(publicKeyB64);

  setKeys(encryptionKey, privateKey, publicKey);

  return { publicKeyB64, saltB64 };
};

export const initLogin = async (
  masterPassword,
  saltB64,
  publicKeyB64,
  privateKeyFile,
  setKeys,
) => {
  const encryptionKey = await derivedSecretKey(masterPassword, saltB64);
  const privateKey = await importPrivateKeyFromFile(
    privateKeyFile,
    encryptionKey,
  );
  const publicKey = await importPublicKey(publicKeyB64);

  const valid = await validateKeyPair(privateKey, publicKey);

  if (!valid) {
    throw new Error("Invalid private key");
  }

  setKeys(encryptionKey, privateKey, publicKey);
};

export const logout = async (clearKeys) => {
  await deletePrivateKeyFromDB();
  clearKeys();
};
