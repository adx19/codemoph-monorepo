import React from "react";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    document.body.appendChild(script);
  });
const handleUpgrade = async () => {
  await loadRazorpay();

  // ✅ CORRECT
  const data = await apiClient.payments.createOrder({
    plan: "monthly_99",
  });

  const options = {
    key: data.key,
    order_id: data.orderId,
    amount: data.amount * 100,
    currency: "INR",
    name: "CodeMorph Pro",
    description: "₹99 / month • 250 credits",
    handler: async (response) => {
      // ✅ CORRECT
      await apiClient.payments.verify({
        ...response,
      });
      window.location.reload();
    },
  };

  new window.Razorpay(options).open();
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "Forever",
    highlight: false,
    tagline: "Perfect for trying out CodeMorph",
    credits: "25 credits total",
    cta: "Current Plan",
    features: [
      "25 free credits on signup",
      "Core AI code transformations",
      "Community support",
    ],
  },
 {
  id: 'pro-monthly',
  name: 'Pro',
  price: '₹99',
  period: '/month',
  highlight: true,
  badge: 'Most Popular',
  tagline: 'For serious builders and small teams',
  credits: '250 credits / month',
  cta: 'Upgrade to Pro',
  features: [
    'Advanced AI transformations',
    'Priority processing and support',
    'Share credits with teammates',
  ],
}

];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-zinc-50">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="inline-flex items-center gap-2 text-xs text-zinc-400 transition hover:text-zinc-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </button>

      <div className="mt-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
            Pricing
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Choose the plan that fits how you code.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Start free with 50 credits, then upgrade to Pro when you need more
            power, history, and collaboration.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/80 px-3 py-1.5 text-[11px] text-zinc-300">
          <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          <span>
            All plans include the VS Code extension and secure processing.
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex h-full flex-col rounded-3xl border bg-zinc-950/70 p-6 text-sm shadow-[0_22px_70px_rgba(0,0,0,0.9)] backdrop-blur-xl ${
              plan.highlight
                ? "border-orange-500/70 ring-1 ring-orange-500/60"
                : "border-white/8"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1 text-[10px] font-semibold text-black shadow-glow">
                <Crown className="h-3 w-3" />
                {plan.badge}
              </div>
            )}

            <h2 className="text-sm font-semibold text-zinc-50">{plan.name}</h2>
            <p className="mt-1 text-xs text-zinc-400">{plan.tagline}</p>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-zinc-50">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-xs text-zinc-400">{plan.period}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-orange-300">{plan.credits}</p>

            <ul className="mt-4 flex-1 space-y-1.5 text-xs text-zinc-300">
              {plan.features.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-[2px] h-3.5 w-3.5 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                if (plan.id === "pro-monthly") {
                  handleUpgrade();
                }
              }}
              disabled={plan.id !== "pro-monthly"}
              className={`mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition ${
                plan.highlight
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-black shadow-glow hover:brightness-110"
                  : "border border-white/12 bg-black/60 text-zinc-100 hover:border-orange-500/60 hover:text-orange-200"
              } ${
                plan.id !== "pro-monthly" ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-white/8 bg-black/60 px-4 py-3 text-[11px] text-zinc-300">
        <p>
          Need higher limits or an on-prem setup?{" "}
          <span className="font-semibold text-orange-300">
            Contact us for an enterprise plan.
          </span>
        </p>
      </div>
    </div>
  );
};

export default Pricing;
