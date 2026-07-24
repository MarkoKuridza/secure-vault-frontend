import { setupMfa, verifySetupMfa } from "../services/AuthService";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";

function MfaSetupPage() {
  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const tempToken = sessionStorage.getItem("tempToken");
        if (!tempToken) {
          navigate("/register");
          return;
        }
        const result = await setupMfa(tempToken);
        setQrCode(result.qrCodeImage);
      } catch {
        setError("Failed to load QR code");
      }
    };
    fetchQr();
  }, [navigate]);

  const handleVerify = async () => {
    setError("");
    try {
      const tempToken = sessionStorage.getItem("tempToken");
      const isOAuth2 = sessionStorage.getItem("isOAuth2") === "true";

      await verifySetupMfa(tempToken, code);

      if (isOAuth2) {
        navigate("/crypto-setup");
      } else {
        sessionStorage.removeItem("tempToken");
        navigate("/login");
      }
    } catch (err) {
      setError("Invalid code");
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "lightgrey",
        px: 2,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: "100%" }}>
        <Typography variant="h6" textAlign="center" mb={2}>
          Setup MFA
        </Typography>

        {qrCode && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pb: 4,
            }}
          >
            <img src={qrCode} alt="QRCode..." />
          </Box>
        )}

        <Typography variant="body2" mb={2} textAlign="center">
          Scan QR code with your authenticator app and enter the code
        </Typography>

        <TextField
          fullWidth
          label="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          slotProps={{
            htmlInput: { maxLength: 6 },
          }}
        />

        {error && (
          <Typography color="error" mt={1}>
            {error}
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleVerify}
        >
          Verify
        </Button>
      </Paper>
    </Box>
  );
}

export default MfaSetupPage;
