import { Route, Routes } from "react-router-dom";
import Layout from "./Layout.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Pricing from "./pages/Pricing.jsx";
import TransactionHistory from "./pages/TransactionHistory.jsx";
import PaymentHistory from "./pages/PaymentHistory.jsx";
import SharedCredits from "./pages/SharedCredits.jsx";
import RequireAuth from "./routes/RequireAuth.jsx";
import { Toaster } from "react-hot-toast";
import OAuthCallback from "./routes/OAuthCallback.jsx";

const App = () => {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />

          {/* ✅ OAuth callback — PUBLIC */}
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/pricing"
            element={
              <RequireAuth>
                <Pricing />
              </RequireAuth>
            }
          />

          <Route
            path="/transactions"
            element={
              <RequireAuth>
                <TransactionHistory />
              </RequireAuth>
            }
          />

          <Route
            path="/payments"
            element={
              <RequireAuth>
                <PaymentHistory />
              </RequireAuth>
            }
          />

          <Route
            path="/shared-credits"
            element={
              <RequireAuth>
                <SharedCredits />
              </RequireAuth>
            }
          />
        </Route>
      </Routes>
    </>
  );
};

export default App;
