import React from "react";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePayments } from "../hooks/usePayments";

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePayments();

  // payments list
  const payments = data?.data || [];

  // compute total spent
  const totalSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // compute current plan
  const currentPlan = totalSpent > 0 ? "Pro" : "Free";

  // compute next renewal (only if Pro)
  const lastPayment = payments.length > 0 ? payments[0] : null;
  const nextRenewal = lastPayment
    ? new Date(new Date(lastPayment.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    : "N/A";

  if (error) {
    console.error("PAYMENTS ERROR → ", error);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-zinc-50">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="inline-flex items-center gap-2 text-xs text-zinc-400 transition hover:text-zinc-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="mt-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-baseline">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
          <p className="mt-1 text-sm text-zinc-400">View all your subscription payments.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <SummaryCard label="Current Plan" value={currentPlan} />
        <SummaryCard label="Total Spent" value={`₹${totalSpent}`} />
        <SummaryCard label="Next Renewal" value={nextRenewal} />
      </div>

      {/* Loading */}
      {isLoading && <p className="text-zinc-400 text-sm mt-6">Loading payments...</p>}

      {/* Empty state */}
      {!isLoading && payments.length === 0 && (
        <div className="mt-8 rounded-3xl border border-white/8 bg-zinc-950/70 p-8 text-center text-sm text-zinc-400 shadow-[0_22px_70px_rgba(0,0,0,0.9)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-zinc-700/80">
            <CreditCard className="h-5 w-5 text-zinc-500" />
          </div>
          <p className="mt-3 text-base font-medium text-zinc-100">No payments yet</p>
          <p className="mt-1 text-xs text-zinc-500">Upgrade to Pro to see invoices here.</p>
          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2 text-xs font-semibold text-black shadow-glow hover:brightness-110"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Payments list */}
      {!isLoading && payments.length > 0 && (
        <div className="mt-6 space-y-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex justify-between rounded-xl border border-white/8 bg-zinc-950/60 px-4 py-3 text-sm"
            >
              <div>
                <p className="text-zinc-100 font-medium">Pro Subscription</p>
                <p className="text-xs text-zinc-400">
                  {new Date(p.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-emerald-400 font-semibold">+₹{p.amount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value }) => (
  <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-4">
    <p className="text-xs text-zinc-400">{label}</p>
    <p className="mt-2 text-lg font-semibold text-zinc-50">{value}</p>
  </div>
);

export default PaymentHistory;
