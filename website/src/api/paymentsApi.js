import { apiClient } from "./apiClient";


export const paymentsApi = {
  createOrder: async () => {
    return apiClient.request("/payments/create-order", {
      method: "POST",
      body: {},
    });
  },

  verify: async (payload) => {
    return apiClient.request("/payments/verify", {
      method: "POST",
      body: payload,
    });
  },
};
