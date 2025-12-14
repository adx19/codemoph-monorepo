import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const RequireAuth = ({ children }) => {
  const { isAuthenticated, authReady } = useAuth();
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
