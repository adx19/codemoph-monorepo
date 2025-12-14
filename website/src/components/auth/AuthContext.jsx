// src/components/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { showToast } from "../Toast";
import jwtDecode from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // ✅ HYDRATE FROM TOKEN ONLY (SOURCE OF TRUTH)
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        const decoded = jwtDecode(token);

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
      console.error("Auth hydrate error:", err);
      showToast("Session expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setAuthReady(true);
    }
  }, []);

  // ✅ NORMAL LOGIN (EMAIL / OAUTH)
  const login = (token, userData) => {
    if (!token) {
      showToast("Login failed: No token provided.");
      return;
    }

    localStorage.setItem("token", token);

    let finalUser = userData;

    if (!finalUser) {
      const decoded = jwtDecode(token);
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

export const useAuthContext = () => useContext(AuthContext);
