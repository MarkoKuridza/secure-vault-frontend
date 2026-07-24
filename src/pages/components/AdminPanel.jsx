import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  enableDisableHoneypot,
  honeypotStatus,
} from "../../services/HoneypotService";
import { useEffect, useState } from "react";
import {
  adminGetAllUsers,
  adminLockUser,
  adminUnlockUser,
  getSecurityPolicy,
  updateSecurityPolicy,
} from "../../services/SecretService";
import { Build, Lock, LockOpen, People, Policy } from "@mui/icons-material";
import { useWebSocket } from "../../utils/useWebSocket";
import { useSnackbar } from "../../context/SnackbarContext";

function SectionCard({ icon, title, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        {icon}
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {children}
    </Paper>
  );
}

const POLICY_FIELDS = [
  {
    key: "minMasterPasswordLength",
    label: "Master password length",
    unit: "characters",
    min: 8,
    max: 32,
  },
  {
    key: "secretRotationDays",
    label: "Secret rotation period",
    unit: "days",
    min: 1,
    max: 30,
  },
  {
    key: "sessionDurationMinutes",
    label: "Session duration",
    unit: "minutes",
    min: 1,
    max: 30,
  },
];

function PolicyField({ label, unit, min, max, value, error, onChange }) {
  return (
    <Box>
      <TextField
        label={label}
        type="number"
        size="small"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        error={!!error}
        helperText={error ?? `Min: ${min} · Max: ${max}`}
        slotProps={{
          htmlInput: { min, max },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="caption" color="text.secondary">
                  {unit}
                </Typography>
              </InputAdornment>
            ),
          },
        }}
        sx={{ width: 240 }}
      />
    </Box>
  );
}

function AdminPanel() {
  const { showSnackbar } = useSnackbar();
  const { alerts } = useWebSocket();

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  const [policyForm, setPolicyForm] = useState({
    minMasterPasswordLength: 12,
    secretRotationDays: 10,
    sessionDurationMinutes: 15,
  });
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policyError, setPolicyError] = useState("");
  const [policyErrors, setPolicyErrors] = useState({});

  const [honeypotEnabled, setHoneypotEnabled] = useState();

  useEffect(() => {
    fetchUsers();
    fetchPolicy();
    const loadHoneypot = async () => {
      await fetchHoneypotStatus()
        .then(setHoneypotEnabled)
        .catch(() => {});
    };

    loadHoneypot();
    // fetchHoneypotStatus()
    //     .then(setHoneypotEnabled)
    //     .catch(() => { });
  }, []);

  const fetchHoneypotStatus = async () => {
    const res = await honeypotStatus();
    setHoneypotEnabled(res);
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const data = await adminGetAllUsers();
      setUsers(data);
    } catch {
      setUsersError("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchPolicy = async () => {
    setPolicyLoading(true);
    setPolicyError("");
    try {
      const data = await getSecurityPolicy();
      setPolicyForm(data);
    } catch {
      setPolicyError("Failed to load policy");
    } finally {
      setPolicyLoading(false);
    }
  };

  const handlePolicySave = async () => {
    const fieldErrors = {};

    for (const { key, min, max } of POLICY_FIELDS) {
      const v = Number(policyForm[key]);
      if (isNaN(v) || v < min || v > max) {
        fieldErrors[key] = `Must be between ${min} and ${max}`;
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      setPolicyErrors(fieldErrors);
      return;
    }

    setPolicyErrors({});
    setPolicyError("");
    try {
      await updateSecurityPolicy(policyForm);
      showSnackbar("Policy updated successfully!", "success");
    } catch {
      setPolicyError("Failed to save policy");
    }
  };

  const handleEnableDisableHoneypot = async () => {
    await enableDisableHoneypot();
    setHoneypotEnabled((prev) => !prev);
  };

  const handleLock = async (user) => {
    try {
      if (user.accountLocked) {
        await adminUnlockUser(user.uuid);
        showSnackbar("User unlocked", "info");
      } else {
        await adminLockUser(user.uuid);
        showSnackbar("User locked", "warning");
      }
      fetchUsers();
    } catch {
      setUsersError("Failed to update user.");
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 3, px: 2 }}>
      <SectionCard icon={<Policy color="primary" />} title="Security policies">
        {policyLoading ? (
          <CircularProgress />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {POLICY_FIELDS.map(({ key, label, unit, min, max }) => (
              <PolicyField
                key={key}
                label={label}
                unit={unit}
                min={min}
                max={max}
                value={policyForm[key]}
                error={policyErrors[key]}
                onChange={(v) => setPolicyForm((f) => ({ ...f, [key]: v }))}
              />
            ))}

            {policyError && <Alert severity="error">{policyError}</Alert>}
            <Box>
              <Button variant="contained" onClick={handlePolicySave}>
                Save policy
              </Button>
            </Box>
          </Box>
        )}
      </SectionCard>

      <SectionCard icon={<People color="primary" />} title="Users">
        {usersError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {usersError}
          </Alert>
        )}

        {usersLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Username</strong>
                </TableCell>
                <TableCell>
                  <strong>Email</strong>
                </TableCell>
                <TableCell>
                  <strong>Roles</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.uuid}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles.map((r) => (
                      <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.accountLocked ? "Locked" : "Active"}
                      color={user.accountLocked ? "error" : "success"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip
                      title={
                        user.accountLocked ? "Unlock account" : "Lock account"
                      }
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        color={user.accountLocked ? "success" : "error"}
                        startIcon={
                          user.accountLocked ? (
                            <LockOpen fontSize="small" />
                          ) : (
                            <Lock fontSize="small" />
                          )
                        }
                        onClick={() => handleLock(user)}
                      >
                        {user.accountLocked ? "Unlock" : "Lock"}
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <SectionCard icon={<Build color="primary" />} title="Honeypot">
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip
            label={honeypotEnabled ? "Enabled" : "Disabled"}
            color={honeypotEnabled ? "success" : "default"}
          />
          <Button
            variant="outlined"
            color={honeypotEnabled ? "error" : "success"}
            onClick={handleEnableDisableHoneypot}
          >
            {honeypotEnabled ? "Disable" : "Enable"}
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Honeypot Alerts
          </Typography>
          {alerts.length === 0 ? (
            <Chip label="No alerts yet" color="default" />
          ) : (
            <List
              sx={{
                maxHeight: 300,
                overflow: "auto",
                bgcolor: "background.paper",
                borderRadius: 2,
              }}
            >
              {alerts.map((a, index) => (
                <Box key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography fontWeight="bold" color="error">
                          Honeypot Triggered
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <b>User:</b> {a.user}
                          </Typography>

                          <Typography variant="body2">
                            <b>IP:</b> {a.ip}
                          </Typography>

                          <Typography variant="body2">
                            <b>Payload:</b> {a.payload}
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            {a.message}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>

                  {index !== alerts.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </SectionCard>
    </Box>
  );
}

export default AdminPanel;
