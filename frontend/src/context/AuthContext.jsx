import { createContext, useState, useEffect } from "react";
import * as authApi from "../api/authApi";

export const AuthContext = createContext(null);

const TEST_USERS = [
  {
    id: "e1d5a7d6-3e4b-4bda-bc6a-4d7a188f615b",
    name: "Alice Smith",
    email: "alice@company.com",
    password: "SecurePass123!",
    role: "EMPLOYEE",
    departmentId: "d1d5a7d6-3e4b-4bda-bc6a-4d7a188f615b",
    department: "Engineering",
    status: "ACTIVE",
    createdAt: "2026-07-12T09:00:00Z",
    updatedAt: "2026-07-12T09:00:00Z",
  },
  {
    id: "e2d5a7d6-3e4b-4bda-bc6a-4d7a188f615c",
    name: "Bob Jones",
    email: "bob@company.com",
    password: "SecurePass123!",
    role: "EMPLOYEE",
    departmentId: "d2d5a7d6-3e4b-4bda-bc6a-4d7a188f615c",
    department: "Operations",
    status: "ACTIVE",
    createdAt: "2026-07-12T09:05:00Z",
    updatedAt: "2026-07-12T09:05:00Z",
  },
  {
    id: "e3d5a7d6-3e4b-4bda-bc6a-4d7a188f615d",
    name: "Charlie Brown",
    email: "charlie@company.com",
    password: "SecurePass123!",
    role: "EMPLOYEE",
    departmentId: "d3d5a7d6-3e4b-4bda-bc6a-4d7a188f615d",
    department: "Finance",
    status: "ACTIVE",
    createdAt: "2026-07-12T09:10:00Z",
    updatedAt: "2026-07-12T09:10:00Z",
  },
];

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

    // If it's a mock token, rehydrate the user from localStorage
    if (token.startsWith("mock-jwt-token-")) {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      setUser(res.data);
    } catch (err) {
      // In case of a temporary network issue, fallback to stored user if available
      if (err.code === "NETWORK_ERROR") {
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setLoading(false);
          return;
        }
      }
      // If unauthorized, clear tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    // 1. Check local test users
    const localUsers = JSON.parse(localStorage.getItem("localUsers") || "[]");
    const matchedUser = [...TEST_USERS, ...localUsers].find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (matchedUser) {
      const token = `mock-jwt-token-${matchedUser.id}`;
      localStorage.setItem("accessToken", token);
      localStorage.setItem("refreshToken", "mock-refresh-token");
      localStorage.setItem("currentUser", JSON.stringify(matchedUser));
      setUser(matchedUser);
      return {
        success: true,
        data: {
          accessToken: token,
          refreshToken: "mock-refresh-token",
          user: matchedUser,
        },
      };
    }

    // 2. If not a mock user, perform real API request
    try {
      const res = await authApi.login({ email, password });
      const { accessToken, refreshToken, user: loggedInUser } = res.data;
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
      // Fallback for local sandbox testing if backend is offline
      if (err.code === "NETWORK_ERROR") {
        const localUsers = JSON.parse(localStorage.getItem("localUsers") || "[]");
        if (
          TEST_USERS.some((u) => u.email.toLowerCase() === email.toLowerCase()) ||
          localUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())
        ) {
          throw {
            code: "EMAIL_ALREADY_EXISTS",
            message: "Email already exists",
          };
        }

        const newUser = {
          id: crypto.randomUUID ? crypto.randomUUID() : `user-${Math.random().toString(36).substr(2, 9)}`,
          name,
          email,
          password,
          role: "EMPLOYEE",
          departmentId: "d2d5a7d6-3e4b-4bda-bc6a-4d7a188f615c",
          department: "Operations",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        localUsers.push(newUser);
        localStorage.setItem("localUsers", JSON.stringify(localUsers));
        return {
          success: true,
          data: newUser,
          message: "Account created (Local Sandbox Mode)",
        };
      }
      throw err;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("accessToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
    setUser(null);

    // Call logout endpoint if we're using a real session
    if (token && !token.startsWith("mock-jwt-token-")) {
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
