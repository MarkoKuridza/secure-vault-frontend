import {
  CheckCircleOutline,
  ContentCopy,
  LockOutline,
  Refresh,
} from "@mui/icons-material";
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard";
import { getSecurityPolicy } from "../services/SecretService";

const CHAR_SET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateMasterPassword(length) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CHAR_SET[b % CHAR_SET.length]).join("");
}

function MasterPasswordSetup({ onComplete }) {
  const [masterPassword, setMasterPassword] = useState("");
  const [passwordLength, setPasswordLength] = useState(0);

  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMasterPassword = async () => {
      const length = await getMasterPasswordLength();
      setPasswordLength(length);
      const generatedPassword = generateMasterPassword(length);

      setMasterPassword(generatedPassword);
    };
    loadMasterPassword();
  }, []);

  const getMasterPasswordLength = async () => {
    try {
      const data = await getSecurityPolicy();
      return data.minMasterPasswordLength;
    } catch {
      return 12;
    }
  };

  const handleRegenerate = () => {
    setMasterPassword(generateMasterPassword(passwordLength));
    setCopied(false);
    setConfirmed(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(masterPassword).then(() => {
      setCopied(true);
    });
  };

  const handleConfirmChange = (e) => {
    const checked = e.target.checked;
    setConfirmed(checked);
    setError("");
    if (checked) {
      onComplete(masterPassword);
    } else {
      onComplete(null);
    }
  };

  //ako se regenerise password nakon potvrde
  const handleRegenerateWithReset = () => {
    handleRegenerate();
    onComplete(null);
  };

  return (
    <SectionCard
      icon={<LockOutline fontSize="small" color="primary" />}
      title="Master password"
      error={!!error}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "action.hover",
          borderRadius: 1,
          px: 2,
          py: 1.5,
        }}
      >
        <Typography
          variant="body2"
          fontFamily="monospace"
          sx={{ flexGrow: 1, wordBreak: "break-all", letterSpacing: "0.05em" }}
        >
          {masterPassword}
        </Typography>

        <Tooltip title={copied ? "Copied" : "Copy to clipboard"}>
          <IconButton
            size="small"
            onClick={handleCopy}
            color={copied ? "success" : "default"}
          >
            {copied ? (
              <CheckCircleOutline fontSize="small" />
            ) : (
              <ContentCopy fontSize="small" />
            )}
          </IconButton>
        </Tooltip>

        <Tooltip title="Generate new password">
          <IconButton size="small" onClick={handleRegenerateWithReset}>
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <FormControlLabel
        sx={{ mt: 2 }}
        control={
          <Checkbox
            checked={confirmed}
            onChange={handleConfirmChange}
            color={error ? "error" : "primary"}
          />
        }
        label={
          <Typography variant="body2">
            I have saved my master password
          </Typography>
        }
      />
      {error && (
        <Typography variant="caption" color="error" display="block" ml={1.5}>
          {error}
        </Typography>
      )}
    </SectionCard>
  );
}

export default MasterPasswordSetup;
