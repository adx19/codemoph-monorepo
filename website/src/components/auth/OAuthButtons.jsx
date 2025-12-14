const OAuthButtons = () => {
  return (
    <div className="space-y-2">
      {/* Google (placeholder) */}
      <button
        type="button"
        disabled
        className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300 opacity-60 cursor-not-allowed"
      >
        Continue with Google (coming soon)
      </button>

      {/* GitHub (placeholder) */}
      <button
        type="button"
        disabled
        className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300 opacity-60 cursor-not-allowed"
      >
        Continue with GitHub (coming soon)
      </button>
    </div>
  );
};

export default OAuthButtons;
