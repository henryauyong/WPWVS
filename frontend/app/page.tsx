"use client";

import React, { useEffect, useState } from "react";
import { usePlayer } from "./context/PlayerContext";
import { Music, Play, Pause, Folder } from "lucide-react";
import Link from "next/link";

interface SongData {
  files: string[];
  folders: string[];
  path: string;
}

export default function Home() {
  const [data, setData] = useState<SongData>({ files: [], folders: [], path: "" });
  const [loading, setLoading] = useState(true);
  const { currentSong, isPlaying, playSong } = usePlayer();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/songs`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch songs:", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-12 pb-32">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-2">My Music Library</h1>
        <p className="text-zinc-500">Root Directory</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Folders Section */}
          {data.folders.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-zinc-400">Folders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.folders.map((folder) => {
                  const encodedPath = btoa(encodeURIComponent(folder));
                  return (
                  <Link 
                    key={folder}
                    href={`/${encodedPath}`}
                    className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                      <Folder size={20} />
                    </div>
                    <span className="font-medium truncate">{folder}</span>
                  </Link>
                )})}
              </div>
            </section>)}
          
          {/* Songs Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-zinc-400">Songs</h2>
            {data.files.length === 0 ? (
              <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-500">No music files in this folder</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.files.map((song) => {
                  // 在根目錄，path 是空的，所以歌曲路徑就是檔名
                  const songPath = song;
                  const isThisPlaying = currentSong === songPath && isPlaying;
                  
                  return (
                    <div 
                      key={song}
                      className={`group p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
                        currentSong === songPath 
                          ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                      }`}
                      onClick={() => playSong(songPath)}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                        currentSong === songPath 
                          ? "bg-zinc-800 dark:bg-zinc-200" 
                          : "bg-zinc-100 dark:bg-zinc-800"
                      }`}>
                        {isThisPlaying ? (
                          <div className="flex gap-1 items-end h-4">
                            <div className="w-1 bg-white dark:bg-black animate-bounce" style={{ animationDelay: '0s', height: '60%' }}></div>
                            <div className="w-1 bg-white dark:bg-black animate-bounce" style={{ animationDelay: '0.2s', height: '100%' }}></div>
                            <div className="w-1 bg-white dark:bg-black animate-bounce" style={{ animationDelay: '0.4s', height: '40%' }}></div>
                          </div>
                        ) : (
                          <Music size={24} className={currentSong === songPath ? "text-white dark:text-black" : "text-zinc-400"} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{song}</h3>
                        <p className={`text-xs ${currentSong === songPath ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-500"}`}>
                          Local File
                        </p>
                      </div>

                      <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${currentSong === songPath ? "opacity-100" : ""}`}>
                        {isThisPlaying ? (
                          <Pause size={20} fill="currentColor" />
                        ) : (
                          <Play size={20} fill="currentColor" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
