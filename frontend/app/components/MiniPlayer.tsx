"use client";

import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

export default function MiniPlayer() {
  const { currentSong, isPlaying, duration, currentTime, togglePlay, seek, setVolume } = usePlayer();

  if (!currentSong) return null;

  const fileName = currentSong.split('/').pop() || currentSong;

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "--:--";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 shadow-lg z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
        
        {/* Song Info */}
        <div className="flex items-center flex-1 min-w-0">
          <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center mr-3 flex-shrink-0">
            <Volume2 className="text-zinc-500" size={20} />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-medium dark:text-zinc-100 truncate" title={currentSong}>{fileName}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">PlayerWeb Stream</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center flex-1 max-w-md">
          <div className="flex items-center gap-6 mb-2">
            <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <SkipBack size={20} />
            </button>
            <button 
              onClick={togglePlay}
              className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            </button>
            <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <SkipForward size={20} />
            </button>
          </div>
          
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 min-w-[30px] text-right">{formatTime(currentTime)}</span>
            <div 
              className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full cursor-pointer relative overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const clickedProgress = x / rect.width;
                seek(clickedProgress * duration);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-black dark:bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 min-w-[30px]">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume - Desktop Only */}
        <div className="hidden md:flex items-center justify-end flex-1 gap-2">
          <Volume2 size={16} className="text-zinc-400" />
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            className="w-24 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-black dark:accent-white"
            defaultValue="1"
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>

      </div>
    </div>
  );
}
