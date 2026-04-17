import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export function ResyncButton() {
  const { token } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMessage("Refreshing...");
    try {
      const res = await fetch(`${API_URL}/files/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const text = await res.text();
        setMessage(text);
      } else {
        setMessage("Failed to refresh");
      }
    } catch (e) {
      setMessage("Error refreshing");
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition disabled:opacity-50"
      >
        <RefreshCcw size={16} className={isRefreshing ? "animate-spin" : ""} />
        Resync Library
      </button>
      {message && <span className="text-sm text-zinc-400 animate-pulse">{message}</span>}
    </div>
  );
}
