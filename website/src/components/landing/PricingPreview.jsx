import React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    tagline: 'Perfect for trying out CodeMorph',
    credits: '25 credits',
    highlight: false,
    cta: 'Current Plan',
    features: ['25 free credits on signup', 'Basic code transformations', 'Community support'],
  },
  {
    name: 'Pro',
    price: '₹99',
    suffix: '/month',
    tagline: 'For serious developers and teams',
    credits: '250 credits / month',
    highlight: true,
    cta: 'Upgrade to Pro',
    badge: 'Most Popular',
    features: [
      'Advanced AI transformations',
      'Credit sharing with teammates',
      'Priority processing and support',
    ],
  },
];

const PricingPreview = () => {
  const navigate = useNavigate();

  return (
    <section className="border-t border-white/5 bg-gradient-to-b from-black via-neutral-950 to-black py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              Plans
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              Start free, scale when you need it
            </h2>
            <p className="mt-3 max-w-lg text-sm text-zinc-400">
              Everyone starts with 50 free credits. Upgrade to Pro when you need more power,
              credits, and collaboration.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center gap-2 rounded-full border border-orange-500/60 bg-black/60 px-4 py-2 text-xs font-semibold text-orange-300 backdrop-blur transition hover:bg-orange-500/10"
          >
            <Crown className="h-3.5 w-3.5" />
            View full pricing
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className={`relative rounded-3xl border bg-zinc-950/70 p-6 shadow-[0_22px_70px_rgba(0,0,0,0.85)] backdrop-blur-xl ${
                plan.highlight
                  ? 'border-orange-500/70 ring-1 ring-orange-500/60'
                  : 'border-white/8'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1 text-[10px] font-semibold text-black shadow-glow">
                  <Crown className="h-3 w-3" />
                  {plan.badge}
                </div>
              )}
              <h3 className="text-sm font-semibold text-zinc-50">{plan.name}</h3>
              <p className="mt-1 text-xs text-zinc-400">{plan.tagline}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-zinc-50">
                  {plan.price}
                </span>
                {plan.suffix && (
                  <span className="text-xs text-zinc-400">{plan.suffix}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-orange-300">{plan.credits}</p>

              <ul className="mt-4 space-y-1.5 text-xs text-zinc-300">
                {plan.features.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-[2px] h-3.5 w-3.5 text-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className={`mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-black shadow-glow hover:brightness-110'
                    : 'border border-white/12 bg-black/60 text-zinc-100 hover:border-orange-500/60 hover:text-orange-200'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingPreview;
