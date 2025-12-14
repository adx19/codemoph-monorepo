import toast from "react-hot-toast";
import { showToast } from "../components/Toast";
import API_BASE_URL2 from "./apiConfig";

const API_BASE =
  API_BASE_URL2 || 'http://localhost:5000';

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    showToast("Login failed. Please check your credentials.");
    throw new Error(data?.message || 'Login failed');
  }

  return data; // { token }
}

export async function signup(username, email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    showToast("Signup failed. Please try again.");
    throw new Error(data?.message || 'Signup failed');
  }

  return data; // success response
}
