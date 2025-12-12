import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("access") || null);

    const login = (accessToken) => {
        localStorage.setItem("access", accessToken);
        setToken(accessToken);
    };

    const logout = () => {
        localStorage.removeItem("access");
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);


