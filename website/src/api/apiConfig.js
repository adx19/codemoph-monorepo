const API_BASE_URL2 = import.meta.env.VITE_BACKEND_URL;

if (!API_BASE_URL2) {
  throw new Error("VITE_BACKEND_URL is not defined");
}

export default API_BASE_URL2;
