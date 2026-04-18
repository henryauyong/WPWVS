import { redirect } from "react-router";

const API_URL = import.meta.env.VITE_API_URL;

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  // 1. 自動注入 Authorization Header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 403 || response.status === 401) {
    localStorage.clear();
    return redirect("/login");
  }

  if (!response.ok) {
    throw response;
  }

  return response;
}
