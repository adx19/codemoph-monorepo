// src/components/auth/AuthModal.jsx
import React from "react";
import { X } from "lucide-react";
import * as authApi from "../../api/authApi"; // <– alias to avoid name clash
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { showToast } from "../Toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const handleGitHub = () => {
  window.location.href = 'http://localhost:5000'+ "/auth/github/login";
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

  // pull *context* login
  const { login: authLogin } = useAuth();

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) {
    return null;
  }

  // src/components/auth/AuthModal.jsx (inside the component)
  const decodeJwtPayload = (token) => {
    try {
      const [, payload] = token.split(".");
      return JSON.parse(atob(payload));
    } catch {
      showToast("Failed to decode JWT payload.");
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let res;

      if (mode === "login") {
        res = await authApi.login(email, password);
      } else {
        res = await authApi.signup(name, email, password);
      }

      const token = res.token || res.data?.token;
      if (!token) {
        showToast("No token received from server.");
        throw new Error("No token received from server");
      }

      const payload = decodeJwtPayload(token);

      const userData = {
        // backend puts `username` in JWT payload :contentReference[oaicite:3]{index=3}
        name: payload?.username || payload?.name || name || email.split("@")[0],
        email: payload?.email || email,
      };

      // ✅ this matches AuthContext.login(token, userData)
      authLogin(token, userData);

      onAuthSuccess?.();
    } catch (err) {
      showToast("Authentication failed. Please try again.");
      console.error(err);
      setError(err?.message || "Authentication failed. Please try again.");
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

        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-orange-600 shadow-glow">
            <span className="text-sm font-black text-black">CM</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              CodeMorph
            </span>
            <span className="text-[11px] text-zinc-400">
              AI Code Transformations
            </span>
          </div>
        </div>

        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-zinc-900/80 px-2 py-1 text-[10px] font-medium text-orange-300">
            <span className="h-1 w-1 rounded-full bg-orange-500" />
            <span>Orange / Black mode</span>
          </div>
        </div>

        <div className="mb-4 flex gap-1 rounded-full bg-zinc-900/80 p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${
              mode === "login"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-black shadow-glow"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${
              mode === "signup"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-black shadow-glow"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1 text-xs">
              <label className="text-zinc-300">Name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-orange-500/80 focus:bg-zinc-900/90"
              />
            </div>
          )}

          <div className="space-y-1 text-xs">
            <label className="text-zinc-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-orange-500/80 focus:bg-zinc-900/90"
            />
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300">Password</label>
              <button
                type="button"
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-orange-500/80 focus:bg-zinc-900/90"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2.5 text-sm font-semibold text-black shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? "Please wait…"
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
            <div className="h-px flex-1 bg-zinc-800" />
            <span>Or continue with</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
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
                window.location.href = `${API_BASE_URL}/auth/google`;
              }}
              className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-orange-500/70 hover:text-orange-300"
            >
              Continue with Google
            </button>
          </div>
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-zinc-500">
          This site is protected by reCAPTCHA and the Google Privacy Policy and
          Terms of Service apply.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
