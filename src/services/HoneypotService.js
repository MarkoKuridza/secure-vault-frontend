import api from "../api/api";

export const enableDisableHoneypot = async () => {
  return api.post("/test/admin/enableAndDisable");
};

export const honeypotStatus = async () => {
  return api.get("/test/admin/status");
};

//direct call
export const honeypotAttack = async () => {
  return api.get("/test/honey");
};

//simulate sql injection
export const sqlInjectionOnHoneypot = async () => {
  return api.get("/test/honey?username=' OR '1'='1");
};
