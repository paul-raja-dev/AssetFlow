import { createContext, useState, useEffect } from "react";
import * as authApi from "../api/authApi";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      // Handle wrapped or raw user shape from response
      const userData = res.data || res;
      setUser(userData);
    } catch (err) {
      console.error("Session validation failed on startup:", err);
      // Clear invalid session tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      
      // Extract from response structure
      const authData = res.data || res;
      const { accessToken, refreshToken, user: loggedInUser } = authData;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return res;
    } catch (err) {
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await authApi.signup({ name, email, password });
      return res;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("accessToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
    setUser(null);

    if (token) {
      try {
        await authApi.logout();
      } catch (err) {
        console.error("Logout API call failed:", err);
      }
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    validateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
