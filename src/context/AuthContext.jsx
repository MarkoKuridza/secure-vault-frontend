import { createContext, useContext, useEffect, useState } from "react";
import { validate } from "../services/AuthService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    const [roles, setRoles] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        validate()
            .then(() => setIsAuthenticated(true))
            .catch(() => setIsAuthenticated(false))
            .finally(() => setLoading(false))
    }, []);

    const login = (userRoles) => {
        console.log("AuthContext login called with:", userRoles);
        setIsAuthenticated(true);
        setRoles(userRoles);
    }
    const logout = () => {
        setIsAuthenticated(false);
        setRoles([]);
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, roles, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    console.log("useAuth called, context:", context);
    return context;
};