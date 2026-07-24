import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import { sqlInjectionOnHoneypot } from "../../services/HoneypotService";
import { useSnackbar } from "../../context/SnackbarContext";
import { BugReportOutlined } from "@mui/icons-material";
import VaultPage from "../VaultPage";
import { ROLES } from "../../utils/roles";

function DeveloperPanel() {
  const { showSnackbar } = useSnackbar();

  const simulateAttack = async () => {
    try {
      await sqlInjectionOnHoneypot();
      showSnackbar("You have been casted to void!", "success");
    } catch {
      showSnackbar("Error occurred!", "error");
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 3, px: 2 }}>
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <VaultPage role={ROLES.DEVELOPER} />
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 2.5,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <BugReportOutlined color="primary" />
            SQL injection attack
          </Typography>
        </Box>
        <Divider sx={{ mb: 3, mt: 2 }} />
        <Button variant="contained" color="warning" onClick={simulateAttack}>
          Simulate
        </Button>
      </Paper>
    </Box>
  );
}

export default DeveloperPanel;
