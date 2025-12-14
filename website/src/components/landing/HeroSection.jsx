import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = ({ onGetStarted }) => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-radial-grid">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.32),transparent_55%)]" />

      <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col px-4 pb-16 pt-8">
        <div className="flex items-center justify-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-zinc-300 backdrop-blur">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-orange-600 text-[10px] font-semibold text-black shadow-glow">
              VS
            </span>
            <span className="font-medium">VS Code Extension</span>
            <span className="h-1 w-1 rounded-full bg-orange-500" />
            <span className="text-zinc-400">AI-powered code transformations</span>
          </div>
        </div>

        <motion.div
          className="mt-16 flex flex-col items-start gap-10 md:flex-row md:items-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-xl space-y-6">
            <h1 className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl">
              CodeMorph
            </h1>
            <p className="text-sm text-zinc-300 sm:text-base">
              Transform your coding workflow with AI-powered refactors, migrations, and
              intelligent edits — all from inside VS Code.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-black shadow-glow transition hover:brightness-110"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-5 py-2.5 text-sm font-semibold text-zinc-100 backdrop-blur transition hover:border-orange-500/70 hover:text-orange-300"
              >
                View Pricing
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-300 sm:text-sm">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                <span>25 free credits on signup</span>
              </div>
              <span className="h-1 w-1 rounded-full bg-zinc-500" />
              <span>250 Pro credits per month</span>
              <span className="h-1 w-1 rounded-full bg-zinc-500" />
              <span>Shared with your team</span>
            </div>
          </div>

          <motion.div
            className="mt-10 w-full max-w-md md:mt-0 md:ml-auto"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/80 via-black/80 to-zinc-900/40 p-5 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              <div className="absolute -top-8 right-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1 text-[10px] font-semibold text-black shadow-glow">
                <span className="h-1.5 w-1.5 rounded-full bg-black/60" />
                Live in your editor
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>CodeMorph Credits</span>
                <span className="rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] text-emerald-300">
                  FREE
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-zinc-400">Available Credits</p>
                  <p className="text-4xl font-bold tracking-tight text-orange-400">25</p>
                </div>
                <div className="rounded-2xl bg-zinc-900/80 px-3 py-2 text-right text-[11px] text-zinc-300">
                  <p>Shared</p>
                  <p className="font-semibold text-sky-300">0</p>
                  <p className="mt-1 text-zinc-500">Upgrade to Pro for 250+</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 text-[11px] text-zinc-300">
                <div className="rounded-2xl bg-zinc-900/80 p-3">
                  <p className="text-zinc-400">Used Today</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">0</p>
                </div>
                <div className="rounded-2xl bg-zinc-900/80 p-3">
                  <p className="text-zinc-400">Shared Out</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">0</p>
                </div>
                <div className="rounded-2xl bg-zinc-900/80 p-3">
                  <p className="text-zinc-400">Days Left</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-300">30</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
