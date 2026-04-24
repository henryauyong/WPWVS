import { Link, useParams } from "react-router";
import { Folder, Music, Heart, LayoutGrid, List, ChevronRight, Search, X } from "lucide-react";
import { usePlayer } from "../contexts/PlayerContext";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { apiClient } from "~/utils/apiClient";

const API_URL = import.meta.env.VITE_API_URL;

interface Item {
  id: number;
  name: string;
  type_id: number;
  parent_id: number;
  duration?: number;
  subtitles?: any[];
}

interface PathItem {
  id: string;
  name: string;
}

interface FolderViewProps {
  folderName: string;
  children: Item[];
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function FolderView({ folderName, children }: FolderViewProps) {
  const { folderSlug: paramsFolder } = useParams();
  const folderId = paramsFolder ? parseInt(paramsFolder.split("-")[0]) : 0;
  
  const { play, currentTrack } = usePlayer();
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<PathItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Item[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Default to list view if not set, or whatever is in localStorage
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    const savedMode = localStorage.getItem('folderViewMode');
    if (savedMode === 'grid' || savedMode === 'list') {
      setViewMode(savedMode);
    }
  }, []);

  const toggleViewMode = () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    localStorage.setItem('folderViewMode', newMode);
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await apiClient(`/users/me/favorites`);
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.map((f: any) => f.file_id));
        }
      } catch (e) {}
    };
    fetchFavorites();
  }, [token]);

  useEffect(() => {
    const fetchPath = async () => {
      try {
        const res = await apiClient(`/files/folder/${folderId}/path`);
        if (res.ok) {
          const data = await res.json();
          setBreadcrumbs(data);
        }
      } catch (e) {}
    };
    if (token) {
      fetchPath();
    }
    // Clear search when folder changes
    setSearchQuery("");
    setSearchResults(null);
  }, [folderId, token]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await apiClient(`/files/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  const displayItems = searchResults !== null ? searchResults : children;
  const folders = displayItems.filter((item) => item.type_id === 1);
  const files = displayItems.filter((item) => item.type_id === 2);

  const toggleFavorite = async (fileId: number) => {
    try {
      const res = await fetch(`${API_URL}/users/me/favorites/${fileId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (favorites.includes(fileId)) {
          setFavorites(favorites.filter((id) => id !== fileId));
        } else {
          setFavorites([...favorites, fileId]);
        }
      }
    } catch (e) {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-2 mb-6 text-sm text-zinc-400 min-h-[24px]">
        {breadcrumbs.length > 0 && breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          // 根目錄對應 "/", 其他對應 "/folder/{id}-{name}"
          const to = crumb.id === "0" ? "/" : `/folder/${crumb.id}-${crumb.name}`;
          
          return (
            <div key={crumb.id} className="flex items-center gap-2">
              {isLast ? (
                <span className="font-semibold text-white">{crumb.name}</span>
              ) : (
                <>
                  <Link 
                    to={to} 
                    className="hover:text-blue-400 transition-colors"
                  >
                    {crumb.name}
                  </Link>
                  <ChevronRight size={16} className="text-zinc-600" />
                </>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">
          {searchResults !== null ? `Search Results for "${searchQuery}"` : folderName}
        </h1>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-4 pr-16 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Search"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
          
          <button
            onClick={toggleViewMode}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition flex items-center gap-2 whitespace-nowrap shrink-0"
            title={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
          >
            {viewMode === 'list' ? <LayoutGrid size={20} className="text-zinc-400" /> : <List size={20} className="text-zinc-400" />}
            <span className="text-sm font-medium text-zinc-400 hidden sm:inline">
              {viewMode === 'list' ? 'Grid View' : 'List View'}
            </span>
          </button>
        </div>
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-zinc-400">Folders</h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <div key={folder.id} className="relative group">
                  <Link
                    to={`/folder/${folder.id}-${folder.name}`}
                    className="flex flex-col items-center p-4 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl transition h-full"
                  >
                    <Folder size={48} className="text-blue-500 mb-2 group-hover:scale-110 transition" fill="currentColor" fillOpacity={0.2} />
                    <span className="text-sm text-center truncate w-full">{folder.name}</span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(folder.id);
                    }}
                    className={`absolute top-2 right-2 p-1.5 hover:bg-zinc-700/50 rounded-full transition`}
                    title="Toggle Favorite"
                  >
                    <Heart
                      size={16}
                      className={favorites.includes(folder.id) ? "text-red-500 fill-red-500" : "text-zinc-400"}
                    />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-900 group transition"
                >
                  <Link
                    to={`/folder/${folder.id}-${folder.name}`}
                    className="flex items-start gap-4 flex-1"
                  >
                    <Folder size={18} className="text-blue-500 shrink-0 mt-0.5" fill="currentColor" fillOpacity={0.2} />
                    <span className="text-sm font-medium break-all">{folder.name}</span>
                  </Link>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(folder.id);
                      }}
                      className="p-2 hover:bg-zinc-800 rounded-full transition"
                    >
                      <Heart
                        size={18}
                        className={favorites.includes(folder.id) ? "text-red-500 fill-red-500" : "text-zinc-500"}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Music Files Section */}
      {files.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-zinc-400">Music</h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {files.map((file) => (
                <div key={file.id} className="relative group">
                  <div
                    onClick={() => play(file as any)}
                    className={`flex flex-col items-center p-4 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl transition h-full cursor-pointer ${
                      currentTrack?.id === file.id ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <Music size={48} className={`${currentTrack?.id === file.id ? "text-blue-400" : "text-zinc-500"} mb-2 group-hover:scale-110 transition`} />
                    <span className={`text-sm text-center truncate w-full ${currentTrack?.id === file.id ? "text-blue-400" : ""}`}>{file.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {file.duration !== undefined && file.duration > 0 && (
                        <span className="text-[10px] text-zinc-500">{formatDuration(file.duration)}</span>
                      )}
                      {(file.subtitles && file.subtitles.length > 0) && (
                        <span className="text-[10px] text-zinc-500">附帶字幕</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(file.id);
                    }}
                    className={`absolute top-2 right-2 p-1.5 hover:bg-zinc-700/50 rounded-full transition`}
                    title="Toggle Favorite"
                  >
                    <Heart
                      size={16}
                      className={favorites.includes(file.id) ? "text-red-500 fill-red-500" : "text-zinc-400"}
                    />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3 rounded-lg hover:bg-zinc-900 group transition ${
                    currentTrack?.id === file.id ? "bg-zinc-900 text-blue-400" : ""
                  }`}
                >
                  <div 
                    className="flex items-start gap-4 flex-1 cursor-pointer"
                    onClick={() => play(file as any)}
                  >
                    <Music size={18} className={`${currentTrack?.id === file.id ? "text-blue-400" : "text-zinc-500"} shrink-0 mt-0.5`} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium break-all">{file.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {file.duration !== undefined && file.duration > 0 && (
                          <span className="text-xs text-zinc-500">{formatDuration(file.duration)}</span>
                        )}
                        {(file.subtitles && file.subtitles.length > 0) && (
                          <span className="text-xs text-zinc-500 text-left">附帶字幕</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(file.id);
                      }}
                      className="p-2 hover:bg-zinc-800 rounded-full transition"
                    >
                      <Heart 
                        size={18} 
                        className={favorites.includes(file.id) ? "text-red-500 fill-red-500" : "text-zinc-500"} 
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      
      {folders.length === 0 && files.length === 0 && (
        <p className="text-zinc-500 text-center py-20">This folder is empty.</p>
      )}
    </div>
  );
}
