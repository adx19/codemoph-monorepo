import React from "react";
import { AlertTriangle, ArrowLeft, ChevronRight, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { showToast } from "../components/Toast";

const SharedCredits = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("sent");
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [email, setEmail] = useState("");

  // ✅ ADD THIS LINE
  const activeList = activeTab === "sent" ? sent : received;
  const totalShared = sent.length;
  const totalReceived = received.length;
  const activeShares = totalShared + totalReceived;

  const fetchSharedCredits = async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        apiClient.sharedCredits.sent(),
        apiClient.sharedCredits.received(),
      ]);

      setSent(sentRes.sent || []);
      setReceived(receivedRes.received || []);
    } catch (err) {
      showToast("Failed to load shared credits");
      console.error("FETCH SHARED CREDITS ERROR 👉", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedCredits();
  }, []);

  const handleShare = async () => {
    if (!email) {
      showToast("Please enter an email");
      return;
    }

    try {
      await apiClient.sharedCredits.share({ email });
      setEmail("");
      setShowShareModal(false);
      fetchSharedCredits();
      showToast("Credits shared successfully");
    } catch (err) {
      showToast("Failed to share credits");
      console.error("SHARE ERROR 👉", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-sm text-zinc-400">Loading shared credits…</div>
    );
  }

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

      <div className="mt-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-baseline">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shared Credits</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage credits you've shared and received.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-4">
          <p className="text-xs text-zinc-400">Total Shared</p>
          <p className="mt-2 text-lg font-semibold text-zinc-50">
            {totalShared}
          </p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-4">
          <p className="text-xs text-zinc-400">Total Received</p>
          <p className="mt-2 text-lg font-semibold text-zinc-50">
            {totalReceived}
          </p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-4">
          <p className="text-xs text-zinc-400">Active Shares</p>
          <p className="mt-2 text-lg font-semibold text-zinc-50">
            {activeShares}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-xs text-amber-100">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-[2px] h-4 w-4" />
          <div>
            <p className="text-xs font-semibold">Important Note</p>
            <p className="mt-1 text-[11px]">
              Shared credits expire when the sender's subscription expires. Make
              sure to use them before the expiry date.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {/* Tabs */}
        <div className="inline-flex rounded-full bg-zinc-950/80 p-1 text-xs text-zinc-300">
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={`rounded-full px-3 py-1 ${
              activeTab === "sent"
                ? "bg-zinc-800 text-zinc-50"
                : "text-zinc-400"
            }`}
          >
            Sent ({sent.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("received")}
            className={`rounded-full px-3 py-1 ${
              activeTab === "received"
                ? "bg-zinc-800 text-zinc-50"
                : "text-zinc-400"
            }`}
          >
            Received ({received.length})
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-black hover:brightness-110"
          >
            <Share2 className="h-4 w-4" />
            Share credits
          </button>

          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="inline-flex items-center gap-1 text-[11px] text-orange-300 hover:text-orange-200"
          >
            Get more credits
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {activeList.length === 0 ? (
        // ✅ EMPTY STATE
        <div className="mt-6 rounded-3xl border border-white/8 bg-zinc-950/70 p-10 text-center text-sm text-zinc-400 shadow-[0_22px_70px_rgba(0,0,0,0.9)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-zinc-700/80">
            <Share2 className="h-5 w-5 text-zinc-500" />
          </div>
          <p className="mt-3 text-base font-medium text-zinc-100">
            {activeTab === "sent"
              ? "You haven't shared any credits yet"
              : "You haven't received any credits yet"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Shared credits will appear here once you start sharing with your
            team.
          </p>
        </div>
      ) : (
        // ✅ LIST VIEW
        <div className="mt-6 space-y-3">
          {activeList.map((item) => (
            <div
              key={item.id || item.shared_user_id}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-zinc-950/70 px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  {activeTab === "sent"
                    ? item.shared_username
                    : item.owner_username}
                </p>
                <p className="text-xs text-zinc-400">
                  {activeTab === "sent" ? item.shared_email : item.owner_email}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-zinc-400">Expires</p>
                <p className="text-sm text-zinc-200">
                  {new Date(item.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-100">
              Share Credits
            </h2>

            <p className="mt-1 text-xs text-zinc-400">
              Enter the email of the user you want to share credits with.
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="mt-4 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="rounded-lg px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>

              <button
                onClick={handleShare}
                className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-black hover:brightness-110"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedCredits;
