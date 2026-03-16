import { Box, Button, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as authLogin } from "../services/AuthService"
import { useAuth } from "../context/AuthContext";
import { VALID_ROLES } from "../util/roles";

function LoginForm() {
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const auth = useAuth();
    console.log("Full auth object:", auth); 
    const { login } = auth;

    const validate = () => {
        const newErrors = {};
        if (!credentials.username.trim())
            newErrors.username = "Username is required.";
        if (!credentials.password)
            newErrors.password = "Password is required";
        return newErrors;
    }

    const handleChange = (event) => {
        setCredentials({ ...credentials, [event.target.name]: event.target.value });
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const roles = await authLogin(credentials.username, credentials.password);
            console.log("Roles in LoginForm:", roles);
            if (!roles.some(r => VALID_ROLES.includes(r))) {
                setErrors({ general: "Unknown role." });
                return;
            }
            console.log("login function:", login);
            login(roles);
            navigate("/dashboard");
        } catch (error) {
            console.log("Error caught:", error);
            setErrors({ general: "Incorect username or password." });
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
        >
            <TextField
                fullWidth
                label="Username"
                name="username"
                autoComplete="username"
                variant="outlined"
                value={credentials.username}
                onChange={handleChange}
                error={Boolean(errors.username)}
                helperText={errors.username}
                margin="normal"
            />

            <TextField
                fullWidth
                label="Password"
                name="password"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={handleChange}
                error={Boolean(errors.password)}
                helperText={errors.password}
                margin="normal"
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword((p) => !p)} edge="end">
                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}

            />

            {errors.general && (
                <Typography color="error" variant="body2" mt={1}>
                    {errors.general}
                </Typography>
            )}

            <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{
                    mt: 3,
                    textTransform: "none",
                    fontWeight: 600
                }}
            >
                Sign in
            </Button>

        </Box>
    );
}

export default LoginForm;