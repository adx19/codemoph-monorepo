// src/hooks/useAuth.js
import toast from "react-hot-toast";
import { useAuthContext } from "../components/auth/AuthContext";

export const useAuth = () => {
  const ctx = useAuthContext();
  if (!ctx) {
    toast.error("Authentication error. Please try again.");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx; // { user, isAuthenticated, login, logout }
};
