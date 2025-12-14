import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/apiClient";

export const usePayments = () => {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await apiClient.payments.history();
      return res;
    },
    onError: (err) => {
      console.error("💥 Payments Query ERROR → ", err);
    }
  });
};
