import apiClient from "./apiClient";

export const fetchTransactions = async ({ page = 1, limit = 20, type }) => {
  const query = new URLSearchParams({
    page,
    limit,
    ...(type && type !== "all" ? { type } : {}),
  }).toString();

  return apiClient.transactions.list()
    ? apiClient.transactions.list({ query }) // fallback-safe
    : apiClient(`/transactions?${query}`);
};
