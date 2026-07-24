import {
  Box,
  Button,
  Container,
  Divider,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import AdminPanel from "./components/AdminPanel";
import TeamLeadPanel from "./components/TeamLeadPanel";
import DeveloperPanel from "./components/DeveloperPanel";
import { logout as authLogout } from "../services/AuthService";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../utils/roles";
import { useState } from "react";
import { Logout } from "@mui/icons-material";
import { useCryptoActions } from "../utils/useCryptoActions";

const PANEL_TABS = [
  { role: ROLES.ADMIN, label: "Admin", component: AdminPanel },
  { role: ROLES.TEAM_LEAD, label: "Team Lead", component: TeamLeadPanel },
  { role: ROLES.DEVELOPER, label: "Developer", component: DeveloperPanel },
];

function DashboardPage() {
  const { logout: cryptoLogout } = useCryptoActions();
  const { roles, logout } = useAuth();
  const navigate = useNavigate();

  const availableTabs = PANEL_TABS.filter(({ role }) => roles?.includes(role));
  const [activeRole, setActiveRole] = useState(null);

  const effectiveRole = activeRole ?? availableTabs[0]?.role ?? null;

  const handleLogout = async () => {
    try {
      await authLogout(); //deletes access and refresh cookies; access is deleted but refresh is still in browser
    } catch (error) {
      console.warn("Logout failed", error);
    } finally {
      await cryptoLogout(); //deletes private key from indexedDb
      logout(); // marking user unauthorized
      navigate("/login");
    }
  };

  const activePanel = PANEL_TABS.find(({ role }) => role === effectiveRole);

  const ActivePanelComponent = activePanel?.component;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "grey.50" }}>
      <Box
        sx={{
          backgroundColor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {availableTabs.length >= 1 && effectiveRole && (
            <Tabs
              value={effectiveRole}
              onChange={(_, v) => setActiveRole(v)}
              sx={{ minHeight: 56 }}
            >
              {availableTabs.map(({ role, label }) => (
                <Tab
                  key={role}
                  value={role}
                  label={label}
                  sx={{ minHeight: 56 }}
                />
              ))}
            </Tabs>
          )}
          <Divider orientation="vertical" flexItem sx={{ my: 1 }} />

          <Button
            variant="text"
            size="small"
            startIcon={<Logout fontSize="small" />}
            onClick={handleLogout}
            color="inherit"
          >
            Sign out
          </Button>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {ActivePanelComponent ? (
          <ActivePanelComponent />
        ) : (
          <Typography color="text.secondary">No panel available.</Typography>
        )}
      </Container>
    </Box>
  );
}

export default DashboardPage;
