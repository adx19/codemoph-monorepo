import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Clock, Filter, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "../hooks/useTransactions";
import { showToast } from "../components/Toast";

const TYPES = [
  { label: "All Types", value: "all" },
  { label: "Usage", value: "usage" },
  { label: "Purchase", value: "purchase" },
  { label: "Shared In", value: "share_in" },
  { label: "Shared Out", value: "share_out" },
];

const TransactionHistory = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  // 🔑 Backend filter ONLY when not "all"
  const { data, isLoading, error } = useTransactions({
    page,
    limit: 20,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  useEffect(() => {
    if (error) showToast("Failed to load transactions");
  }, [error]);

  const rawTxns = data?.data ?? [];

  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(rawTxns)) return [];

    const q = searchQuery.trim().toLowerCase();

    return rawTxns.filter((txn) => {
      // dropdown filter
      if (typeFilter !== "all" && txn.type !== typeFilter) {
        return false;
      }

      if (!q) return true;

      // 🔢 credit search
      if (!Number.isNaN(Number(q))) {
        return txn.amount === Number(q);
      }

      // 🔤 type search
      return txn.type.toLowerCase().includes(q);
    });
  }, [rawTxns, typeFilter, searchQuery]);

  if (isLoading && rawTxns.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-400">
        Loading transactions…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-zinc-50">
      <button
        onClick={() => navigate("/dashboard")}
        className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </button>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Transaction History
      </h1>

      {/* Search + filter */}
      <div className="mt-6 flex flex-col gap-3 md:flex-row relative">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by type, credits, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-white/10 bg-zinc-950/70 pl-9 pr-3 text-xs"
          />
        </div>

        {/* Filters placeholder */}
        <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/70 px-3 py-2 text-xs">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>

        {/* Type dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/70 px-4 py-2 text-xs"
          >
            {TYPES.find((t) => t.value === typeFilter).label}
            <ChevronDown className="h-3 w-3" />
          </button>

          {showTypeMenu && (
            <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-zinc-900 shadow-xl z-20">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setTypeFilter(t.value);
                    setPage(1);
                    setShowTypeMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-800"
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty */}
      {filteredTransactions.length === 0 && (
        <div className="mt-6 rounded-3xl border border-white/8 bg-zinc-950/70 p-10 text-center text-sm text-zinc-400">
          <Clock className="mx-auto h-5 w-5 text-zinc-500" />
          <p className="mt-4 text-base font-medium text-zinc-100">
            No transactions found
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Try changing your search or filter.
          </p>
        </div>
      )}

      {/* List */}
      <div className="mt-6 space-y-3">
        {filteredTransactions.map((txn) => (
          <div
            key={txn.id}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/60 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium capitalize">
                {txn.type.replace("_", " ")}
              </p>
              <p className="text-xs text-zinc-400">
                {new Date(txn.created_at).toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  txn.amount < 0 ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {txn.amount}
              </p>
              <p className="text-xs text-zinc-400 capitalize">
                {txn.credit_source}
              </p>
            </div>
          </div>
        ))}
        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition
      ${
        page === 1
          ? "cursor-not-allowed border-white/5 text-zinc-600 bg-zinc-900/40"
          : "border-white/10 bg-zinc-950/70 text-zinc-300 hover:bg-zinc-900"
      }`}
          >
            ← Previous
          </button>

          <span className="text-xs text-zinc-500">Page {page}</span>

          <button
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/70 px-4 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
