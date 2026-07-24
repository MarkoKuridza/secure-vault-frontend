import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import MfaSetupPage from "./pages/MfaSetupPage";
import RegistrationPage from "./pages/RegistrationPage";
import { SnackbarProvider } from "./context/SnackbarContext";
import { CryptoProvider } from "./context/CryptoContext";
import CryptoSetupPage from "./pages/CryptoSetupPage";
import OAuth2Callback from "./pages/components/OAuth2Callback";

function App() {
  return (
    <SnackbarProvider>
      <BrowserRouter>
        <AuthProvider>
          <CryptoProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registration" element={<RegistrationPage />} />
              <Route path="/mfa/setup" element={<MfaSetupPage />} />
              <Route path="/crypto-setup" element={<CryptoSetupPage />} />
              <Route path="/oauth2/callback" element={<OAuth2Callback />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </CryptoProvider>
        </AuthProvider>
      </BrowserRouter>
    </SnackbarProvider>
  );
}

export default App;
