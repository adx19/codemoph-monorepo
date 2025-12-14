import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HeroSection from "../components/landing/HeroSection.jsx";
import FeaturesSection from "../components/landing/FeaturesSection.jsx";
import PricingPreview from "../components/landing/PricingPreview.jsx";
import Footer from "../components/landing/Footer.jsx";
import AuthModal from "../components/auth/AuthModal.jsx";
import { useAuth } from "../hooks/useAuth";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated, authReady } = useAuth();

  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const [redirectTo, setRedirectTo] = React.useState("/dashboard");

  // ✅ Handle auth state from navigation (RequireAuth redirect)
  React.useEffect(() => {
    if (!authReady) return;

    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authReady, isAuthenticated, navigate]);

  React.useEffect(() => {
    if (!authReady) return;

    // 🔥 If already logged in, NEVER show auth modal
    if (isAuthenticated) {
      setIsAuthOpen(false);
      return;
    }

    if (location.state?.showAuth) {
      setIsAuthOpen(true);

      if (location.state.redirectTo) {
        setRedirectTo(location.state.redirectTo);
      }

      // clear state so modal doesn't reopen on refresh
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [authReady, isAuthenticated, location, navigate]);

  const handleOpenAuth = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }

    setRedirectTo("/dashboard");
    setIsAuthOpen(true);
  };

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
  };

  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
    navigate(redirectTo || "/dashboard", { replace: true });
  };

  // ⛔ Do nothing until auth is hydrated
  if (!authReady) return null;

  return (
    <div className="bg-gradient-to-b from-black via-neutral-950 to-black text-zinc-50">
      <HeroSection onGetStarted={handleOpenAuth} />
      <FeaturesSection />
      <PricingPreview />
      <Footer />

      <AuthModal
        isOpen={!isAuthenticated && isAuthOpen}
        initialMode={location.state?.initialMode || "login"}
        onClose={handleCloseAuth}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Home;
