import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
const { login } = useAuth();

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const status = params.get("status");
    const token = params.get("token");

    if (status === "success" && token) {
      login(token); // ✅ NO userData needed
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-zinc-400">
      Verifying your email…
    </div>
  );
};

export default VerifyEmail;
