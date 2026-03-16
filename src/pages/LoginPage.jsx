import { Box, Paper, Typography } from "@mui/material";
import LoginForm from "../components/LoginForm";

function LoginPage() {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "lightgray",
                px: 2
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    width: "100%",
                    maxWidth: 400,
                    p: 4,
                    borderRadius: 2
                }}
            >
                <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>
                    Sign in to your account
                </Typography>
                <LoginForm />
            </Paper>
        </Box>
    )
}

export default LoginPage;