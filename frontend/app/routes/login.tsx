import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // The API returns access_token, token_type, user_id
        // We need the full user info, but for now we can fetch it or trust the ID
        // Fetch user info
        const userRes = await fetch(`${API_URL}/users/me`, {
           headers: { Authorization: `Bearer ${data.access_token}` }
        });
        if (userRes.ok) {
            const userData = await userRes.json();
            login(data.access_token, userData);
            navigate("/");
        }
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        {error && <p className="text-red-500 mb-4 text-center text-sm">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
