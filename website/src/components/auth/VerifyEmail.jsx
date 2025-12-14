import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthContext } from "../components/auth/AuthContext";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const { login } = useAuthContext();

  useEffect(() => {
    const status = params.get("status");
    const token = params.get("token");

    if (status === "success" && token) {
      login(token);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-zinc-400">
      Verifying your email…
    </div>
  );
};

export default VerifyEmail;
