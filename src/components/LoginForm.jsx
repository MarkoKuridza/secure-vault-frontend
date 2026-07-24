import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  LockOutline,
  Visibility,
  VisibilityOff,
  CloudUpload,
  Key,
  Close,
} from "@mui/icons-material";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login as authLogin, verifyMfa } from "../services/AuthService";
import { useAuth } from "../context/AuthContext";
import { VALID_ROLES } from "../utils/roles";
import { getCryptoData } from "../services/CryptoService";
import { useCryptoActions } from "../utils/useCryptoActions";

const STEPS = {
  LOGIN: "LOGIN",
  MFA: "MFA",
  GOOGLE_MFA: "GOOGLE_MFA",
  MASTER_PASSWORD: "MASTER_PASSWORD",
};

function LoginForm() {
  const [searchParams] = useSearchParams();
  const { login: cryptoLogin } = useCryptoActions();

  const [step, setStep] = useState(
    searchParams.get("oauth2") === "true" ? STEPS.GOOGLE_MFA : STEPS.LOGIN,
  );

  const [tempToken, setTempToken] = useState(() => {
    if (searchParams.get("oauth2") === "true") {
      return sessionStorage.getItem("tempToken") || "";
    }
    return "";
  });
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [mfaCode, setMfaCode] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [privateKeyFile, setPrivateKeyFile] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    const newErrors = {};
    if (!credentials.username.trim())
      newErrors.username = "Username is required.";
    if (!credentials.password) newErrors.password = "Password is required";
    return newErrors;
  };

  const handleChange = (event) => {
    setCredentials({ ...credentials, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await authLogin(
        credentials.username,
        credentials.password,
      );

      if (result.tempToken) {
        setTempToken(result.tempToken);
        setStep("MFA");
      }
    } catch (error) {
      setErrors({ general: "Incorrect username or password." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      setErrors({ mfa: "Enter valid 6-digit code" });
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyMfa(tempToken, mfaCode);
      const roles = result.roles;

      if (!roles.some((r) => VALID_ROLES.includes(r))) {
        setErrors({ general: "Unknown role." });
        return;
      }

      if (step === STEPS.GOOGLE_MFA) {
        sessionStorage.removeItem("tempToken");
        sessionStorage.removeItem("isOAuth2");
      }

      setTempToken({ token: tempToken, roles });
      setStep("MASTER_PASSWORD");
    } catch (error) {
      setErrors({ mfa: "Invalid MFA code" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMasterPasswordSubmit = async () => {
    if (!masterPassword) {
      setErrors({ masterPassword: "Master Password is required" });
      return;
    }

    if (!privateKeyFile) {
      setErrors({ privateKey: "Private Key is required" });
      return;
    }
    setIsLoading(true);

    try {
      const cryptoData = await getCryptoData();

      await cryptoLogin(
        masterPassword,
        cryptoData.salt,
        cryptoData.publicKey,
        privateKeyFile,
      );

      const { roles } = tempToken;
      login(roles);
      navigate("/dashboard");
    } catch (error) {
      setErrors({
        general: "Incorrect master password or not valid private key",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:9000/oauth2/authorization/google";
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {step === STEPS.LOGIN && (
        <>
          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              mb: 1,
              p: 2.5,
              borderColor:
                errors.username || errors.password ? "error.main" : "divider",
              borderRadius: 2,
            }}
          >
            <TextField
              fullWidth
              label="Username"
              name="username"
              autoComplete="username"
              value={credentials.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
              margin="dense"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              onChange={handleChange}
              error={Boolean(errors.password)}
              helperText={errors.password}
              margin="dense"
              autoComplete="off"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((p) => !p)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Paper>

          {errors.general && (
            <Typography color="error" variant="body2" mt={1}>
              {errors.general}
            </Typography>
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isLoading}
            size="large"
            sx={{ mt: 2.5 }}
          >
            {isLoading ? "Signing in" : "Sign in"}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            sx={{ mt: 1.5 }}
            onClick={handleGoogleLogin}
          >
            Sign in with Google
          </Button>

          <Button
            fullWidth
            variant="text"
            sx={{ mt: 1 }}
            onClick={() => navigate("/registration")}
          >
            Register
          </Button>
        </>
      )}

      {step === STEPS.MFA && (
        <>
          <Typography mb={2}>Enter code from authenticator app</Typography>

          <TextField
            fullWidth
            label="MFA CODE"
            value={mfaCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setMfaCode(value);
            }}
            slotProps={{ htmlInput: { maxLength: 6 } }}
            error={!!errors.mfa}
            helperText={errors.mfa}
            autoFocus
          />

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleMfaVerify}
          >
            Verify
          </Button>
        </>
      )}

      {step === STEPS.GOOGLE_MFA && (
        <>
          <Typography mb={2}>Enter code from authenticator app</Typography>

          <TextField
            fullWidth
            label="MFA CODE"
            value={mfaCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setMfaCode(value);
            }}
            slotProps={{ htmlInput: { maxLength: 6 } }}
            error={!!errors.mfa}
            helperText={errors.mfa}
            autoFocus
          />

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleMfaVerify}
          >
            Verify
          </Button>
        </>
      )}

      {step === STEPS.MASTER_PASSWORD && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <LockOutline color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>
              Enter master password
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Master Password"
            type={showMasterPassword ? "text" : "password"}
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            error={!!errors.masterPassword}
            helperText={errors.masterPassword}
            autoFocus
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowMasterPassword((p) => !p)}
                      edge="end"
                    >
                      {showMasterPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Private Key File <span style={{ color: "red" }}>*</span>
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                borderColor: errors.privateKey
                  ? "error.main"
                  : privateKeyFile
                    ? "success.main"
                    : "divider",
                transition: "border-color 0.2s",
              }}
            >
              {privateKeyFile ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Key color="success" />
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="success.main"
                      >
                        {privateKeyFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(privateKeyFile.size / 1024).toFixed(1)} KB · PEM file
                        ready
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setPrivateKeyFile(null)}
                    title="Remove file"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<CloudUpload />}
                    sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                  >
                    Upload Private Key
                    <input
                      type="file"
                      accept=".pem"
                      hidden
                      onChange={(e) => {
                        setPrivateKeyFile(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>

          {errors.privateKey && (
            <Typography
              variant="caption"
              color="error"
              display="block"
              mt={0.5}
            >
              {errors.privateKey}
            </Typography>
          )}

          {errors.general && (
            <Typography variant="body2" color="error" mt={1}>
              {errors.general}
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, textTransform: "none", fontWeight: 600 }}
            onClick={handleMasterPasswordSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Unlocking..." : "Unlock Vault"}
          </Button>
        </>
      )}
    </Box>
  );
}

export default LoginForm;
