// src/components/auth/AuthModal.jsx
import React from "react";
import { X } from "lucide-react";
import * as authApi from "../../api/authApi";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { showToast } from "../Toast";
import API_BASE_URL from "../../api/apiConfig";

const handleGitHub = () => {
  window.location.href = API_BASE_URL + "/auth/github/start";
};

const AuthModal = ({
  isOpen,
  initialMode = "login",
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = React.useState(initialMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const { login: authLogin } = useAuth();

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const decodeJwtPayload = (token) => {
    try {
      const [, payload] = token.split(".");
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // =====================
      // 🆕 SIGNUP FLOW (NO TOKEN EXPECTED)
      // =====================
      if (mode === "signup") {
        await authApi.signup(name, email, password);

        showToast(
          "Verification email sent. Please check your inbox.",
          { duration: 6000 }
        );

        onAuthSuccess?.();
        return;
      }

      // =====================
      // 🔐 LOGIN FLOW
      // =====================
      const res = await authApi.login(email, password);
      const token = res?.token;

      if (!token) {
        throw new Error("No token received");
      }

      const payload = decodeJwtPayload(token);

      if (!payload) {
        throw new Error("Invalid token");
      }

      const userData = {
        name:
          payload.username ||
          payload.name ||
          email.split("@")[0],
        email: payload.email || email,
      };

      authLogin(token, userData);
      onAuthSuccess?.();
    } catch (err) {
      if (err?.response?.data?.message === "email_not_verified") {
        showToast("Please verify your email before logging in.");
      } else {
        showToast("Authentication failed. Please try again.");
      }

      setError(err?.message || "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === "login" ? "Welcome back" : "Create your account";
  const subtitle =
    mode === "login"
      ? "Sign in to access your CodeMorph dashboard."
      : "Start with free credits and manage your CodeMorph usage.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xl">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/95 p-6 text-zinc-50 shadow-[0_24px_80px_rgba(0,0,0,0.9)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-zinc-900/70 p-1 text-zinc-400 hover:text-zinc-100"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 🔒 EVERYTHING BELOW IS UNCHANGED UI */}

        {/* ... your existing JSX stays EXACTLY the same ... */}

        {/* OAuth buttons */}
        <button
          type="button"
          onClick={handleGitHub}
          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-orange-500/70 hover:text-orange-300"
        >
          Continue with GitHub
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.href = `${API_BASE_URL}/auth/google/start`;
          }}
          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-orange-500/70 hover:text-orange-300"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
