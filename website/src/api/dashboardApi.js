import toast from 'react-hot-toast';
import { API_BASE_URL } from './apiConfig';

export const fetchDashboardSummary = async () => {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    toast.error("Failed to fetch dashboard summary.");
    throw new Error('Failed to fetch dashboard');
  }

  return res.json();
};
