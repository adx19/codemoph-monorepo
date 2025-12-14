import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthContext } from "../components/auth/AuthContext";

const OAuthCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthContext();
  useEffect(() => {
    console.log("OAUTH CALLBACK MOUNTED");
  }, []);

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    try {
      const [, payload] = token.split(".");
      const decoded = JSON.parse(atob(payload));

      login(token, {
        name: decoded.username || decoded.name,
        email: decoded.email,
      });

      navigate("/dashboard", { replace: true });
    } catch {
      navigate("/", { replace: true });
    }
  }, []);

  return null;
};

export default OAuthCallback;
