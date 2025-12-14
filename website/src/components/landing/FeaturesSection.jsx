import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Share2, Shield, History, CreditCard, Users } from 'lucide-react';
import { useTheme } from '../ThemeProvider.jsx';

const features = [
  {
    icon: Zap,
    title: 'Instant transforms',
    description: 'Apply complex refactors and migrations with a single AI-powered command.',
  },
  {
    icon: Share2,
    title: 'Shareable credits',
    description: 'Send credits to teammates to unlock CodeMorph for your whole squad.',
  },
  {
    icon: Shield,
    title: 'Secure by design',
    description: 'Your code stays in your editor; we only see what is needed for a transform.',
  },
  {
    icon: History,
    title: 'Full history',
    description: 'Track every usage, share, and purchase with a transparent audit trail.',
  },
  {
    icon: CreditCard,
    title: 'Simple credits',
    description: '50 free credits, 500+ with Pro, and a clear overview of your balance.',
  },
  {
    icon: Users,
    title: 'Team-friendly',
    description: 'Organize credits across teams and projects with flexible sharing rules.',
  },
];

const FeaturesSection = () => {
  const { isDark } = useTheme();

  return (
    <section className="border-t border-white/5 bg-black/80 py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            Why CodeMorph
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Built for developers who ship fast
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            From solo builders to teams, CodeMorph keeps your codebase modern with AI-powered,
            auditable changes.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="group rounded-2xl border border-white/5 bg-zinc-900/70 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-orange-500/70 hover:shadow-glow"
              >
                <div
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500/90 to-orange-600/90 text-black shadow-glow ${
                    isDark ? '' : 'ring-1 ring-orange-500/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-zinc-50">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
