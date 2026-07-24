import { arrayBufferToBase64, base64ToArrayBuffer } from "./cryptoUtils";

export const privateKeyToPem = (privateKeyBuffer) => {
  const b64 = arrayBufferToBase64(privateKeyBuffer);
  const lines = b64.match(/.{1,64}/g).join("\n");
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
};

export const pemToPrivateKeyBuffer = (pem) => {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  return base64ToArrayBuffer(b64);
};

export const downloadPrivateKeyFile = (privateKeyBuffer, username) => {
  const pem = privateKeyToPem(privateKeyBuffer);
  const blob = new Blob([pem], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${username}_priv_key.pem`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
