import { showToast } from "../components/Toast";
import { API_BASE_URL2 } from "./apiConfig";

const API_BASE_URL = API_BASE_URL2 || "https://codemoph-monorepo-production.up.railway.app";

/**
 * Core request helper
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    cache: "no-store", //  <-- REQUIRED FIX
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    showToast("Request failed. Please try again.");
    throw new Error(text || "Request failed");
  }

  return res.json();
}

/**
 * API object
 */
const apiClient = {
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("Login failed.");
        throw new Error(data?.message || "Login failed");
      }

      // Store backend JWT locally (for your dashboard API)
      localStorage.setItem("token", data.token);

      // Encode token for VS Code URI
      const encodedToken = encodeURIComponent(data.token);

      // Send token to VS Code extension
      window.location.href = `vscode://abhi.CodeMorph/auth?token=${encodedToken}`;

      return data;
    },

    signup: (name, email, password) =>
      request("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),

    logout: () => {
      localStorage.removeItem("token");
      return Promise.resolve();
    },
  },

  dashboard: {
    summary: () => request(`/dashboard/summary?ts=${Date.now()}`),
  },

  transactions: {
    list: ({ page = 1, limit = 20, type, search }) => {
      const params = new URLSearchParams({ page, limit });
      if (type) params.append("type", type);
      if (search) params.append("search", search);

      return request(`/transactions?${params.toString()}`);
    },
  },

  payments: {
    createOrder: (payload) =>
      request("/payments/create-order", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    verify: (payload) =>
      request("/payments/verify", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    history: () => request("/payments"),
  },

  sharedCredits: {
    sent: () => request("/shared-credits/sent"),

    received: () => request("/shared-credits/received"),

    share: (payload) =>
      request("/shared-credits", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
};

export default apiClient;
