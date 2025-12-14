import { toast } from "react-hot-toast";
import { X } from "lucide-react";

export const showToast = (message) => {
  toast.custom((t) => (
    <div
      className="
        pointer-events-auto
        flex items-center gap-3
        rounded-full
        border border-white/15
        bg-black/60
        px-5 py-2.5
        text-sm font-semibold
        text-zinc-100
        backdrop-blur
        shadow-[0_10px_40px_rgba(0,0,0,0.8)]
        transition
        hover:border-orange-500/70
        hover:text-orange-300
      "
    >
      {/* Message */}
      <span className="whitespace-nowrap">{message}</span>

      {/* Close */}
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="
          inline-flex h-5 w-5 items-center justify-center
          rounded-full
          text-orange-400
          transition
          hover:bg-white/10
          hover:text-red-400
        "
        aria-label="Close notification"
      >
        <X className="h-3.5 w-3.5 stroke-[2.5]" />
      </button>
    </div>
  ));
};
