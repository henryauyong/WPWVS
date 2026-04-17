import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Heart, Home as HomeIcon, Settings, X, User as UserIcon } from "lucide-react";
import { ResyncButton } from "./ResyncButton";

const API_URL = import.meta.env.VITE_API_URL;

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout, user, token, login } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setUsernameInput(user.username);
    }
  }, [user, isSettingsOpen]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg("");
    setUpdateError("");
    setIsUpdating(true);

    try {
      const payload: any = {};
      if (usernameInput && usernameInput !== user?.username) {
        payload.username = usernameInput;
      }
      if (passwordInput) {
        payload.password = passwordInput;
      }

      if (Object.keys(payload).length === 0) {
        setUpdateMsg("No changes to update.");
        setIsUpdating(false);
        setTimeout(() => setUpdateMsg(""), 3000);
        return;
      }

      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        if (token) {
          login(token, updatedUser);
        }
        setUpdateMsg("Profile updated successfully!");
        setPasswordInput(""); // clear password after update
      } else {
        const data = await res.json();
        setUpdateError(data.detail || "Failed to update profile.");
      }
    } catch (err) {
      setUpdateError("An error occurred.");
    } finally {
      setIsUpdating(false);
      setTimeout(() => {
        setUpdateMsg("");
        setUpdateError("");
      }, 5000);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <HomeIcon size={20} color="white" />
              </div>
              <span className="hidden sm:inline">Music Player</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link to="/favorites" className="text-zinc-400 hover:text-white transition flex items-center gap-2">
                <Heart size={18} />
                <span className="hidden md:inline">Favorites</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
              title="Settings"
            >
              <Settings size={20} />
              <span className="hidden sm:inline font-medium">Settings</span>
            </button>
            <div className="h-8 w-px bg-zinc-800 mx-2 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-400 hidden sm:inline">{user?.username}</span>
              <button 
                onClick={logout}
                className="p-2 text-zinc-400 hover:text-red-500 transition"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {children}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings size={24} className="text-blue-500" />
                Settings
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-8">
                {/* Account Settings */}
                <section>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <UserIcon size={16} /> Account
                  </h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800/50">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Username</label>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                        placeholder="Enter new username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">New Password (leave blank to keep current)</label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                        placeholder="Enter new password"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition disabled:opacity-50"
                    >
                      {isUpdating ? "Updating..." : "Update Profile"}
                    </button>
                    {updateMsg && <p className="text-green-500 text-sm mt-2 text-center">{updateMsg}</p>}
                    {updateError && <p className="text-red-500 text-sm mt-2 text-center">{updateError}</p>}
                  </form>
                </section>

                {/* Resync Section */}
                <section>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Library</h3>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-sm text-zinc-300">
                      <p className="font-medium text-white mb-1">Resync Database</p>
                      <p>Scan for new or deleted files in the music folder.</p>
                    </div>
                    <ResyncButton />
                  </div>
                </section>
                
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
