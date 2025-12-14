// src/components/auth/AuthModal.jsx
import React from "react";
import { X } from "lucide-react";
import * as authApi from "../../api/authApi";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../Toast";
import API_BASE_URL from "../../api/apiConfig";

const MIN_PASSWORD_LENGTH = 6;

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
      setPassword("");
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

  const passwordTooShort =
    mode === "signup" &&
    password.length > 0 &&
    password.length < MIN_PASSWORD_LENGTH;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (mode === "signup" && passwordTooShort) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);

    try {
      let res;

      if (mode === "login") {
        res = await authApi.login(email, password);
      } else {
        res = await authApi.signup(name, email, password);
      }

      const token = res.token;
      if (!token) throw new Error("No token received");

      const payload = decodeJwtPayload(token);

      const userData = {
        name:
          payload?.username ||
          payload?.name ||
          name ||
          email.split("@")[0],
        email: payload?.email || email,
      };

      authLogin(token, userData);
      onAuthSuccess?.();
    } catch (err) {
      const msg = err?.message;

      if (msg === "email_already_exists") {
        setError("This email is already registered. Try logging in.");
      } else if (msg === "password_too_short") {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      } else if (msg === "invalid_credentials") {
        setError("Invalid email or password.");
      } else {
        setError("Authentication failed. Please try again.");
      }

      showToast("Authentication failed.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xl">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/95 p-6 text-zinc-50">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-zinc-900/70 p-1 text-zinc-400 hover:text-zinc-100"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-semibold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-1 text-xs">
              <label>Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-zinc-900/70 px-3 py-2"
              />
            </div>
          )}

          <div className="space-y-1 text-xs">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-zinc-900/70 px-3 py-2"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-zinc-900/70 px-3 py-2"
            />

            {passwordTooShort && (
              <p className="text-[11px] text-red-400">
                Password must be at least {MIN_PASSWORD_LENGTH} characters
              </p>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || passwordTooShort}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            {isSubmitting
              ? "Please wait…"
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              (window.location.href = `${API_BASE_URL}/auth/github/start`)
            }
            className="rounded-xl border border-white/15 px-4 py-2 text-sm"
          >
            GitHub
          </button>

          <button
            onClick={() =>
              (window.location.href = `${API_BASE_URL}/auth/google/start`)
            }
            className="rounded-xl border border-white/15 px-4 py-2 text-sm"
          >
            Google
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-zinc-400">
          {mode === "login" ? (
            <button onClick={() => setMode("signup")}>
              Don’t have an account? Sign up
            </button>
          ) : (
            <button onClick={() => setMode("login")}>
              Already have an account? Log in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
