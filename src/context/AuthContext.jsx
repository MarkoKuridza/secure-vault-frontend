import { createContext, useContext, useEffect, useRef, useState } from "react";
import { refreshToken, validate } from "../services/AuthService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [roles, setRoles] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  const hasRefreshed = useRef(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await validate();
      setRoles(response.data || []);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      if (!hasRefreshed.current) {
        hasRefreshed.current = true;

        try {
          await refreshToken();
          const response = await validate();
          setIsAuthenticated(true);
          setRoles(response.data || []);
          return true;
        } catch {
          setIsAuthenticated(false);
          setRoles([]);
          return false;
        }
      }
      setRoles([]);
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = (userRoles) => {
    setIsAuthenticated(true);
    setRoles(userRoles);
  };
  const logout = () => {
    setIsAuthenticated(false);
    setRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, roles, loading, login, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};
