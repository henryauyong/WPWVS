import { usePlayer } from "../contexts/PlayerContext";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

export function MiniPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    progress, 
    duration, 
    togglePlay, 
    seek,
    volume,
    setVolume
  } = usePlayer();

  if (!currentTrack) return null;

  const progressPercent = (progress / duration) * 100 || 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 text-white z-50">
      {/* Progress Bar */}
      <div 
        className="h-1 bg-zinc-700 cursor-pointer group relative"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          seek((x / rect.width) * duration);
        }}
      >
        <div 
          className="h-full bg-blue-500 transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="truncate">
            <h4 className="text-sm font-medium truncate">{currentTrack.name}</h4>
            <p className="text-xs text-zinc-400">Playing...</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <button onClick={togglePlay} className="p-2 bg-white text-black rounded-full hover:bg-zinc-200 transition">
            {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" />}
          </button>
          
          <div className="hidden sm:flex items-center gap-2 w-24">
            <Volume2 size={16} />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
