// src/components/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { showToast } from "../Toast";

const AuthContext = createContext(null);

// 🔐 Safe JWT decode (no dependency)
const decodeJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // ✅ Hydrate auth once
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        const decoded = decodeJwt(token);
        if (!decoded) throw new Error("Invalid token");

        const userData = {
          id: decoded.id,
          email: decoded.email,
          username: decoded.username,
        };

        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      showToast("Session expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setAuthReady(true);
    }
  }, []);

  const login = (token, userData) => {
    if (!token) return;

    localStorage.setItem("token", token);

    let finalUser = userData;
    if (!finalUser) {
      const decoded = decodeJwt(token);
      if (!decoded) return;

      finalUser = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
      };
    }

    localStorage.setItem("user", JSON.stringify(finalUser));
    setUser(finalUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, authReady, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 🔴 IMPORTANT: ONLY AUTH HOOK YOU SHOULD USE
export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
};
