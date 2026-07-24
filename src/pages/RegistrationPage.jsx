import { Box, Paper, Typography } from "@mui/material";
import RegistrationForm from "../components/RegistrationForm";

function RegistrationPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "lightgray",
        px: 2,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          maxWidth: 440,
          p: 4,
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>
          Create your account
        </Typography>
        <RegistrationForm />
      </Paper>
    </Box>
  );
}

export default RegistrationPage;
