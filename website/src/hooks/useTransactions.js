// src/hooks/useTransactions.js
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/apiClient";

export const useTransactions = ({
  page = 1,
  limit = 20,
  type = "all",
  search = "",
}) => {
  return useQuery({
    queryKey: ["transactions", page, type, search],
    queryFn: () =>
      apiClient.transactions.list({
        page,
        limit,
        type: type === "all" ? undefined : type,
        search: search || undefined,
      }),
    keepPreviousData: true,
  });
};
