// src/components/auth/AuthModal.jsx
import React from "react";
import { X } from "lucide-react";
import * as authApi from "../../api/authApi";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../Toast";
import API_BASE_URL from "../../api/apiConfig";
import { useAuthContext } from "./AuthContext";

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

  const { login: authLogin } = useAuthContext();

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError("");
    }
  }, [isOpen, initialMode]);

  // ✅ HANDLE EMAIL VERIFIED REDIRECT
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("verified") === "true") {
      showToast("Email verified! You can now log in.", { duration: 5000 });

      params.delete("verified");
      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

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
      if (mode === "signup") {
        await authApi.signup(name, email, password);

        showToast(
          "Verification email sent. Please check your inbox.",
          { duration: 6000 }
        );

        return;
      }

      // LOGIN FLOW
      const res = await authApi.login(email, password);

      const token = res.token;
      if (!token) {
        throw new Error("No token received");
      }

      const payload = decodeJwtPayload(token);

      const userData = {
        name: payload?.username || email.split("@")[0],
        email: payload?.email || email,
      };

      authLogin(token, userData);
      onAuthSuccess?.();
    } catch (err) {
      if (err?.message === "email_not_verified") {
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
      : "Verify your email to activate your account.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xl">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/95 p-6 text-zinc-50">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-zinc-900/70 p-1 text-zinc-400 hover:text-zinc-100"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>

        <div className="mt-4 flex gap-1 rounded-full bg-zinc-900/80 p-1 text-xs">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full px-3 py-1.5 ${
              mode === "login"
                ? "bg-orange-500 text-black"
                : "text-zinc-300"
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full px-3 py-1.5 ${
              mode === "signup"
                ? "bg-orange-500 text-black"
                : "text-zinc-300"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {mode === "signup" && (
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 px-3 py-2 text-xs"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 px-3 py-2 text-xs"
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 px-3 py-2 text-xs"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            disabled={isSubmitting}
            className="w-full rounded-xl bg-orange-500 py-2 text-sm font-semibold text-black"
          >
            {isSubmitting
              ? "Please wait…"
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() =>
              (window.location.href = `${API_BASE_URL}/auth/github`)
            }
            className="rounded-xl border border-white/10 px-4 py-2"
          >
            Continue with GitHub
          </button>

          <button
            onClick={() =>
              (window.location.href = `${API_BASE_URL}/auth/google`)
            }
            className="rounded-xl border border-white/10 px-4 py-2"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
