import { useEffect, useState } from "react";
import {
  createSecret,
  deleteSecret,
  getMySecrets,
  getSharedWithMe,
  getUserPublicKey,
  shareSecret,
  updateSecret,
} from "../services/SecretService";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  Key,
  Lock,
  LockOpen,
  People,
  Share,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  decryptText,
  encryptText,
  importPublicKey,
  shareSecret as cryptoShareSecret,
} from "../utils/cryptoUtils";
import { useSnackbar } from "../context/SnackbarContext";
import { useCrypto } from "../context/CryptoContext";
import { ROLES } from "../utils/roles";

const ROTATION_WARNING_DAYS = 10;

function VaultPage({ role }) {
  const { showSnackbar } = useSnackbar();
  const crypto = useCrypto();

  const [tab, setTab] = useState(0); //dva taba: 0: My_Secrets 1: Shared_Secrets
  const [secrets, setSecrets] = useState([]);
  const [sharedSecrets, setSharedSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    value: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewSecret, setViewSecret] = useState(null);
  const [decryptedValue, setDecryptedValue] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [recipientUsername, setRecipientUsername] = useState("");
  const canShare = role === ROLES.TEAM_LEAD;
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [mine, shared] = await Promise.all([
        getMySecrets(),
        getSharedWithMe(),
      ]);
      setSecrets(mine);
      setSharedSecrets(shared);
    } catch {
      setError("Failed to load secrets");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingSecret(null);
    setForm({ name: "", description: "", value: "" });
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (secret) => {
    setEditingSecret(secret);
    setForm({
      name: secret.name,
      description: secret.description || "",
      value: "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const openShare = (secret) => {
    setShareTarget(secret);
    setRecipientUsername("");
    setShareError("");
    setShareOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!form.value.trim() && !editingSecret) {
      setFormError("Secret value is required");
      return;
    }
    if (!crypto.isInitialized()) {
      setFormError("Public or Private key are not set up correctly");
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      const publicKey = crypto.getPublicKey();
      const encrypted = await encryptText(form.value, publicKey);

      const payload = {
        name: form.name,
        description: form.description,
        encryptedTextB64: encrypted.encryptedTextB64,
        ivB64: encrypted.ivB64,
        encryptedAesKeyB64: encrypted.encryptedAesKeyB64,
      };

      if (editingSecret) {
        await updateSecret(editingSecret.uuid, payload);
        showSnackbar("Secret updated", "success");
      } else {
        await createSecret(payload);
        showSnackbar("Secret created", "success");
      }

      setFormOpen(false);
      fetchAll();
    } catch {
      setFormError("Failed to save secret");
    } finally {
      setFormLoading(false);
    }
  };

  const handleView = async (secret) => {
    setViewSecret(secret);
    setDecryptedValue("");
    setShowValue(false);
    setViewLoading(true);
    setViewOpen(true);

    try {
      const privateKey = crypto.getPrivateKey();
      if (!privateKey) throw new Error("No private key in session");
      const plainText = await decryptText(secret, privateKey);
      setDecryptedValue(plainText);
    } catch {
      setDecryptedValue("Failed decryption");
    } finally {
      setViewLoading(false);
    }
  };

  const handleShare = async () => {
    if (!recipientUsername.trim()) {
      setShareError("Recipient username required");
      return;
    }
    setShareLoading(true);
    setShareError("");

    try {
      const { publicKey: recipientPublicKeyB64 } =
        await getUserPublicKey(recipientUsername);
      const recipientPublicKey = await importPublicKey(recipientPublicKeyB64);

      const privateKey = crypto.getPrivateKey();
      const { encryptedAesKeyB64 } = await cryptoShareSecret(
        shareTarget,
        privateKey,
        recipientPublicKey,
      );

      await shareSecret(
        shareTarget.uuid,
        recipientUsername,
        encryptedAesKeyB64,
      );
      setShareOpen(false);
      showSnackbar(`Share with ${recipientUsername}`, "success");
    } catch {
      setShareError("Failed to share secret");
    } finally {
      setShareLoading(false);
    }
  };

  const handleDelete = async (secret) => {
    try {
      await deleteSecret(secret.uuid);
      showSnackbar("Secret deleted", "info");
      fetchAll();
    } catch {
      setError("Failed to delete");
    }
  };

  const SecretCard = ({ secret, isShared }) => {
    const isStale = secret.daysSinceLastUpdate >= ROTATION_WARNING_DAYS;
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          borderColor: isStale ? "warning.main" : "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Key fontSize="small" color="primary" />
            <Typography fontWeight={600}>{secret.name}</Typography>
            {isShared && (
              <Chip
                label="Shared"
                size="small"
                icon={<People sx={{ fontSize: 14 }} />}
              />
            )}
            {isStale && (
              <Chip label="Rotation due" size="small" color="warning" />
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="View">
              <IconButton size="small" onClick={() => handleView(secret)}>
                <LockOpen fontSize="small" />
              </IconButton>
            </Tooltip>
            {!isShared && (
              <>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => openEdit(secret)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                {canShare && (
                  <>
                    <Tooltip title="Share">
                      <IconButton
                        size="small"
                        onClick={() => openShare(secret)}
                      >
                        <Share fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(secret)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
        {secret.description && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {secret.description}
          </Typography>
        )}
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={0.5}
        >
          Last updated: {new Date(secret.updatedAt).toLocaleDateString()} (
          {secret.daysSinceLastUpdate} days ago)
        </Typography>
      </Paper>
    );
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, px: 2 }}>
      <>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Box Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Lock color="primary" />
            <Typography variant="h5" fontWeight={700}>
              Vault
            </Typography>
          </Box>

          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            New Secret
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!crypto.isInitialized && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Session keys not initialized
          </Alert>
        )}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab label={`My Secrets (${secrets.length})`} />
          <Tab
            label={`Shared with me (${sharedSecrets.length})`}
            icon={<People fontSize="small" />}
            iconPosition="end"
          />
        </Tabs>
        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {tab === 0 &&
              (secrets.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" mt={4}>
                  No secrets yet
                </Typography>
              ) : (
                secrets.map((s) => (
                  <SecretCard key={s.uuid} secret={s} isShared={false} />
                ))
              ))}
            {tab === 1 &&
              (sharedSecrets.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" mt={4}>
                  Nothing shared with you yet
                </Typography>
              ) : (
                sharedSecrets.map((s) => (
                  <SecretCard key={s.uuid} secret={s} isShared={true} />
                ))
              ))}
          </>
        )}

        <Dialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingSecret ? "Edit Secret" : "New Secret"}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              margin="normal"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={!!formError && !form.name.trim()}
            />
            <TextField
              fullWidth
              label="Description (optional)"
              margin="normal"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <TextField
              fullWidth
              label={editingSecret ? "Edit Secret" : "New Secret"}
              margin="normal"
              type="password"
              autoComplete="off"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            {formError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {formError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleFormSubmit}
              disabled={formLoading}
            >
              {formLoading ? (
                <CircularProgress />
              ) : editingSecret ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LockOpen fontSize="small" />
              {viewSecret?.name}
            </Box>
          </DialogTitle>
          <DialogContent>
            {viewLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
              >
                <TextField
                  fullWidth
                  label="Decrypted Value"
                  type={showValue ? "text" : "password"}
                  value={decryptedValue}
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowValue((v) => !v)}>
                            {showValue ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Share fontSize="small" />
              Share "{shareTarget?.name}"
            </Box>
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Recipient Username"
              margin="normal"
              value={recipientUsername}
              onChange={(e) => setRecipientUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleShare()}
            />
            {shareError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {shareError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleShare}
              disabled={shareLoading}
            >
              {shareLoading ? <CircularProgress /> : "Share"}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    </Box>
  );
}

export default VaultPage;
