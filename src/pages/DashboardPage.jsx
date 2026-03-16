import { Box } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import AdminPanel from "./components/AdminPanel";
import TeamLeadPanel from "./components/TeamLeadPanel";
import DeveloperPanel from "./components/DeveloperPanel";
import { ROLES } from "../util/roles";

function DashboardPage() {
    const { roles } = useAuth();
    console.log("Roles on dashboard:", roles);

    return (
        <Box>
            {roles.includes(ROLES.ADMIN) && <AdminPanel />}
            {roles.includes(ROLES.TEAM_LEAD) && <TeamLeadPanel />}
            {roles.includes(ROLES.DEVELOPER) && <DeveloperPanel />}
        </Box>
    );
}

export default DashboardPage;