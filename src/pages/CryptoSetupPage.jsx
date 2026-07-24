import { useNavigate } from "react-router-dom";
import { useCryptoActions } from "../utils/useCryptoActions";
import { useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { setupCrypto } from "../services/CryptoService";
import MasterPasswordSetup from "./MasterPasswordSetup";

function CryptoSetupPage() {
  const navigate = useNavigate();
  const { register: cryptoRegister } = useCryptoActions();

  const [masterPassword, setMasterPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!masterPassword) {
      setError("Must confirm master password");
      return;
    }

    setIsLoading(true);
    try {
      const tempToken = sessionStorage.getItem("tempToken");
      const username = parseUsernameFromToken(tempToken);

      const { publicKeyB64, saltB64 } = await cryptoRegister(
        masterPassword,
        username,
      );

      await setupCrypto(tempToken, { publicKey: publicKeyB64, salt: saltB64 });
      sessionStorage.removeItem("tempToken");
      sessionStorage.removeItem("isOAuth2");

      //login(roles);
      navigate("/login");
    } catch (err) {
      setError("Setup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const parseUsernameFromToken = (token) => {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub;
  };

  return (
    <Box maxWidth={480} mx="auto" mt={6}>
      <Typography variant="h6" mb={1}>
        Setting up security keys
      </Typography>

      <MasterPasswordSetup onComplete={(mp) => setMasterPassword(mp)} />

      {error && (
        <Typography variant="caption" color="error" display="block" ml={1.5}>
          {error}
        </Typography>
      )}
      <Button
        fullWidth
        variant="contained"
        onClick={handleSubmit}
        disabled={isLoading || !masterPassword}
        sx={{ mt: 2 }}
      >
        {isLoading ? <CircularProgress size={24} /> : "Generate keys"}
      </Button>
    </Box>
  );
}

export default CryptoSetupPage;
