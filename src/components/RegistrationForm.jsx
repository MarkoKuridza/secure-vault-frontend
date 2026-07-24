import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/AuthService";
import { useCryptoActions } from "../utils/useCryptoActions";
import AccountBoxOutlinedIcon from "@mui/icons-material/AccountBoxOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import MasterPasswordSetup from "../pages/MasterPasswordSetup";
import SectionCard from "./SectionCard";

const ROLES = ["ADMIN", "TEAM_LEAD", "DEVELOPER"];

function RegistrationForm() {
  const navigate = useNavigate();
  const { register: cryptoRegister } = useCryptoActions();

  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [errors, setErrors] = useState({});

  const [masterPassword, setMasterPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters";
    }
    if (selectedRoles.length === 0) {
      newErrors.roles = "Must select at least 1 role";
    }
    if (!masterPassword) {
      newErrors.masterPassword = "Must confirm master password";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { publicKeyB64, saltB64 } = await cryptoRegister(
        masterPassword,
        form.username,
      );

      const response = await register({
        ...form,
        roles: selectedRoles,
        publicKey: publicKeyB64,
        salt: saltB64,
      });

      sessionStorage.setItem("tempToken", response.tempToken);
      navigate("/mfa/setup");
    } catch (err) {
      if (err.response?.status === 409) {
        setErrors({ general: "Username already taken" });
      } else {
        setErrors({ general: "Registration failed" });
        console.log(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedRoles((prev) => [...prev, value]);
    } else {
      setSelectedRoles((prev) => prev.filter((r) => r !== value));
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <SectionCard
        icon={<PersonOutlineOutlinedIcon fontSize="small" color="primary" />}
        title="Personal details"
        error={errors.username || errors.password || errors.email}
      >
        <TextField
          fullWidth
          label="Username"
          name="username"
          margin="normal"
          value={form.username}
          onChange={handleChange}
          error={!!errors.username}
          helperText={errors.username}
        />
        <TextField
          fullWidth
          label="Email"
          name="email"
          margin="normal"
          value={form.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
        />
        <TextField
          fullWidth
          label="Password"
          name="password"
          margin="normal"
          type={showPassword ? "text" : "password"}
          autoComplete="off"
          value={form.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((p) => !p)}
                    edge="end"
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </SectionCard>

      <SectionCard
        icon={<AccountBoxOutlinedIcon fontSize="small" color="primary" />}
        title="Roles"
        error={errors.roles}
      >
        <FormGroup>
          {ROLES.map((role) => (
            <FormControlLabel
              key={role}
              control={
                <Checkbox
                  checked={selectedRoles.includes(role)}
                  onChange={handleRoleChange}
                  value={role}
                />
              }
              label={role}
            />
          ))}
        </FormGroup>
        {errors.roles && (
          <Typography variant="caption" color="error" display="block" ml={1.5}>
            {errors.roles}
          </Typography>
        )}
      </SectionCard>

      <MasterPasswordSetup
        onComplete={(mp) => {
          setMasterPassword(mp);
        }}
      />

      {errors.masterPassword && (
        <Typography variant="caption" color="error">
          {errors.masterPassword}
        </Typography>
      )}

      {errors.general && (
        <Typography color="error" mt={1}>
          {errors.general}
        </Typography>
      )}

      <Button
        fullWidth
        variant="contained"
        type="submit"
        disabled={isLoading}
        sx={{ mt: 2 }}
      >
        {isLoading ? "Setting up" : "Register"}
      </Button>

      <Button
        fullWidth
        variant="text"
        sx={{ mt: 1 }}
        onClick={() => navigate("/login")}
      >
        Already have an account? Sign in
      </Button>
    </Box>
  );
}

export default RegistrationForm;
