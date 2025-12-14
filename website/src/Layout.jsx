import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, CreditCard, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import apiClient from "./api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "./components/auth/AuthContext";

const navLinkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
    isActive
      ? "bg-orange-500 text-black shadow-glow"
      : "text-zinc-300 hover:text-white hover:bg-zinc-800"
  }`;

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const showNavbar = location.pathname !== "/";
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiClient.dashboard.summary(),
    enabled:
      !!localStorage.getItem("token") && location.pathname === "/dashboard",
  });

  const { user, isAuthenticated , logout} = useAuthContext();
  console.log("AUTH STATE →", { user, isAuthenticated });
  console.log("REQUIRE AUTH →", isAuthenticated);


  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = () => {
    logout(); // ✅ clears context + storage
    navigate("/");
  };

  const userInitial =
    user?.username?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "C";

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-zinc-100">
      {showNavbar && (
        <header className="fixed inset-x-0 top-0 z-30 border-b border-white/5 bg-black/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div
              className="flex cursor-pointer items-center gap-2"
              onClick={() => navigate("/")}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-orange-600 shadow-glow">
                <span className="text-sm font-black text-black">CM</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight">
                  CodeMorph
                </span>
                <span className="text-xs text-zinc-400">
                  AI Code Transformations
                </span>
              </div>
            </div>

            <nav className="hidden items-center gap-1 md:flex">
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/pricing" className={navLinkClass}>
                Pricing
              </NavLink>
              <NavLink to="/transactions" className={navLinkClass}>
                Transactions
              </NavLink>
              <NavLink to="/payments" className={navLinkClass}>
                Payments
              </NavLink>
              <NavLink to="/shared-credits" className={navLinkClass}>
                Shared Credits
              </NavLink>
            </nav>

            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-orange-500/70 hover:bg-zinc-900/90"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-[10px] font-semibold">
                    {userInitial}
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-medium text-zinc-100">
                      {user?.name || user?.email?.split("@")[0] || "Guest"}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {user?.email || "Not signed in"}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-zinc-400" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-white/10 bg-zinc-950/95 p-3 text-xs shadow-[0_18px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-sm font-semibold">
                        {userInitial}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-zinc-50">
                          {user?.name || user?.email?.split("@")[0] || "Guest"}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {user?.email || "Not signed in"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-zinc-200 hover:bg-zinc-800/80"
                      >
                        <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm">Dashboard</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/pricing")}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-zinc-200 hover:bg-zinc-800/80"
                      >
                        <CreditCard className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm">Upgrade Plan</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-red-400 hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <main className={showNavbar ? "pt-16" : ""}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
