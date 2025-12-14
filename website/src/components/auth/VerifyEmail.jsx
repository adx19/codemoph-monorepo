import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const s = params.get("status");
    const token = params.get("token");

    if (s === "success" && token) {
      loginWithToken(token);
      setStatus("success");

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1200);
    } else if (s === "expired") {
      setStatus("expired");
    } else {
      setStatus("error");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 dark:bg-black text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-8 text-center shadow-xl">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-indigo-400" />
            <h2 className="text-xl font-semibold">Verifying your email</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Please wait a moment…
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
            <h2 className="text-xl font-semibold">Email verified</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Redirecting you to your dashboard…
            </p>
          </>
        )}

        {status === "expired" && (
          <>
            <XCircle className="mx-auto mb-4 h-10 w-10 text-yellow-400" />
            <h2 className="text-xl font-semibold">Link expired</h2>
            <p className="mt-2 text-sm text-zinc-400">
              This verification link is no longer valid.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            >
              Go to login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />
            <h2 className="text-xl font-semibold">Verification failed</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
