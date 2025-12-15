import React from "react";
import { ArrowRight, Clock, CreditCard, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/apiClient";
import { useAuth } from "../hooks/useAuth";
import { useAuthContext } from "../components/auth/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiClient.dashboard.summary(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const firstName =
    user?.username?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  console.log("dashboard summary →", user, error);

  const {
    availableCredits = 0,
    usedToday = 0,
    sharedOut = 0,
    received = 0,
    daysLeft = "—",
    recentActivity = [],
    plan,
    subscriptionEndsAt,
  } = summary || {};

  // ✅ useMemo MUST be called every render
  const computedDaysLeft = React.useMemo(() => {
    const now = new Date();

    // 🟢 PAID users → use subscription end date
    if (subscriptionEndsAt) {
      const end = new Date(subscriptionEndsAt);
      const diff = Math.ceil(
        (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diff > 0 ? diff : "Expired";
    }

    // 🔵 FREE users → end of current month
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const diff = Math.ceil(
      (endOfMonth.getTime() - now.getTime()-1) / (1000 * 60 * 60 * 24)
    );

    return diff;
  }, [subscriptionEndsAt]);

  if (isLoading || summary) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 text-zinc-50">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Welcome back, {firstName}.
            </h1>

            <p className="mt-1 text-sm text-zinc-400">
              Manage your CodeMorph credits and activity.
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              *In case request fails, try signing in again
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const token = localStorage.getItem("token");
                if (!token) {
                  showToast("You must be logged in to link with VS Code.");
                  return;
                }

                const encoded = encodeURIComponent(token);

                // Open VS Code via deep link
                window.location.href = `vscode://abhi.CodeMorph/auth?token=${encoded}`;
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-zinc-900/70 px-4 py-2 text-xs font-semibold hover:border-orange-500/70"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Open in VS Code
            </button>

            <button
              onClick={() => navigate("/shared-credits")}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-zinc-900/70 px-4 py-2 text-xs font-semibold hover:border-orange-500/70"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share Credits
            </button>

            <button
              onClick={() => navigate("/transactions")}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-zinc-900/70 px-4 py-2 text-xs font-semibold hover:border-orange-500/70"
            >
              <Clock className="h-3.5 w-3.5" />
              History
            </button>

            <button
              onClick={() => navigate("/pricing")}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-xs font-semibold text-black shadow-glow hover:brightness-110"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* Credits summary */}
        <div className="mt-8 grid gap-6 md:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl border border-white/8 bg-zinc-950/70 p-6 shadow-[0_22px_70px_rgba(0,0,0,0.9)]">
            <p className="text-xs text-zinc-400">Available Credits</p>
            <p className="mt-2 text-4xl font-bold text-orange-400">
              {availableCredits}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-zinc-300">
              <Stat label="Used Today" value={usedToday} />
              <Stat label="Shared Out" value={sharedOut} />
              <Stat label="Received" value={received} />
              <Stat label="Days Left" value={computedDaysLeft} accent />
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-3xl border border-white/8 bg-zinc-950/70 p-6">
            <h2 className="text-sm font-semibold">Recent Activity</h2>

            {recentActivity.length === 0 ? (
              <p className="mt-6 text-sm text-zinc-400">No activity yet.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-xs">
                {recentActivity.map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between rounded-lg border border-white/5 bg-zinc-900/60 px-3 py-2"
                  >
                    <span className="capitalize">
                      {item.type.replace("_", " ")}
                    </span>
                    <span
                      className={
                        item.amount < 0 ? "text-red-400" : "text-emerald-400"
                      }
                    >
                      {item.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }
};
const Stat = ({ label, value, accent }) => (
  <div className="rounded-xl bg-zinc-900/80 px-3 py-2">
    <p className="text-xs text-zinc-400">{label}</p>
    <p
      className={`mt-1 text-lg font-semibold ${
        accent ? "text-emerald-300" : ""
      }`}
    >
      {value}
    </p>
  </div>
);

export default Dashboard;
