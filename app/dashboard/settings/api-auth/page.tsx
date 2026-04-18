"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/src/lib/apiClient";

export default function ApiAuthSettings() {
  const [status, setStatus] = useState<string>("Not generated");

  const generateToken = async () => {
    const res = await apiFetch("/api/auth/login", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("accessToken", data.accessToken);
      setStatus("Token generated");
    } else {
      setStatus("Failed to generate token");
    }
  };

  const manualRefresh = async () => {
    const res = await apiFetch("/api/auth/refresh", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("accessToken", data.accessToken);
      setStatus("Token refreshed");
    } else {
      setStatus("Refresh failed");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">API Authentication Settings</h1>
      <p className="mb-2">Current status: {status}</p>
      <button onClick={generateToken} className="mr-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
        Generate Token
      </button>
      <button onClick={manualRefresh} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
        Refresh Token
      </button>
    </div>
  );
}
