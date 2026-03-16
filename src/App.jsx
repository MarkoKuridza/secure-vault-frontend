import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from './routes/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
