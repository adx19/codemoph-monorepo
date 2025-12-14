import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthContext } from "../components/auth/AuthContext";

const RequireAuth = ({ children }) => {
  const { isAuthenticated, authReady } = useAuthContext();
  const location = useLocation();

  // ⏳ Wait until auth is hydrated from localStorage
  if (!authReady) {
    return null; // or loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default RequireAuth;
