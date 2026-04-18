import { Link, useParams } from "react-router";
import { Folder, Music, Heart, LayoutGrid, List, ChevronRight } from "lucide-react";
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
}

interface PathItem {
  id: string;
  name: string;
}

interface FolderViewProps {
  folderName: string;
  children: Item[];
}

export function FolderView({ folderName, children }: FolderViewProps) {
  const { folderSlug: paramsFolder } = useParams();
  const folderId = paramsFolder ? parseInt(paramsFolder.split("-")[0]) : 0;
  
  const { play, currentTrack } = usePlayer();
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [subtitles, setSubtitles] = useState<Record<number, boolean>>({});
  const [breadcrumbs, setBreadcrumbs] = useState<PathItem[]>([]);
  
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
  }, [folderId, token]);

  const folders = children.filter((item) => item.type_id === 1);
  const files = children.filter((item) => item.type_id === 2);
  const fileIds = files.map(f => f.id).join(',');

  useEffect(() => {
    const checkSubtitles = async () => {
      if (files.length === 0 || !token) return;
      const subtitleStatus: Record<number, boolean> = {};
      await Promise.allSettled(
        files.map(async (file) => {
          try {
            const res = await fetch(`${API_URL}/files/subtitle/${file.id}`, {
              method: 'HEAD',
              headers: { Authorization: `Bearer ${token}` }
            });
            subtitleStatus[file.id] = res.ok;
          } catch (e) {
            subtitleStatus[file.id] = false;
          }
        })
      );
      setSubtitles(subtitleStatus);
    };
    checkSubtitles();
  }, [fileIds, token]);

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

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{folderName}</h1>
        <button
          onClick={toggleViewMode}
          className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition flex items-center gap-2"
          title={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
        >
          {viewMode === 'list' ? <LayoutGrid size={20} className="text-zinc-400" /> : <List size={20} className="text-zinc-400" />}
          <span className="text-sm font-medium text-zinc-400 hidden sm:inline">
            {viewMode === 'list' ? 'Grid View' : 'List View'}
          </span>
        </button>
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
                    {subtitles[file.id] && (
                      <span className="text-[10px] text-zinc-500 mt-1">附帶字幕</span>
                    )}
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
                      {subtitles[file.id] && (
                        <span className="text-xs text-zinc-500 mt-0.5 text-left">附帶字幕</span>
                      )}
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
