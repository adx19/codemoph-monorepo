import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "./AuthContext";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, authReady, isAuthenticated } = useAuthContext();

  // Step 1: login from token
  useEffect(() => {
    const status = params.get("status");
    const token = params.get("token");

    if (status === "success" && token) {
      login(token);
    }
  }, []);

  // Step 2: redirect AFTER auth settles
  useEffect(() => {
    if (authReady && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authReady, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center text-zinc-400">
      Verifying your email…
    </div>
  );
};

export default VerifyEmail;
