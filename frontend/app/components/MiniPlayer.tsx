import { useEffect } from "react";
import { usePlayer } from "../contexts/PlayerContext";
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Music, Rewind, FastForward } from "lucide-react";

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlay,
    seek,
    volume,
    setVolume,
    isExpanded,
    setIsExpanded,
    playNext,
    playPrevious
  } = usePlayer();
  // 攔截上一頁按鈕 (popstate) 與鎖定背景滾動 (僅限手機版)
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    
    if (isExpanded && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    const handlePopState = () => {
      if (isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.body.style.overflow = "unset";
    };
  }, [isExpanded, setIsExpanded]);

  const handleExpand = () => {
    if (!isExpanded) {
      if (window.innerWidth < 1024) {
        window.history.pushState({ playerExpanded: true }, "");
      }
      setIsExpanded(true);
    }
  };

  const handleClose = () => {
    if (isExpanded) {
      setIsExpanded(false);
      if (window.history.state?.playerExpanded && window.innerWidth < 1024) {
        window.history.back();
      }
    }
  };

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  // Format time (e.g., 03:45)
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <>
      {/* 迷你播放器 */}
      {!isExpanded && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 text-white z-50 cursor-pointer hover:bg-zinc-800 transition-colors"
          onClick={(e) => {
            // 如果點擊的不是按鈕或進度條，才展開
            const target = e.target as HTMLElement;
            if (!target.closest('button') && !target.closest('.progress-bar') && !target.closest('.volume-control')) {
              handleExpand();
            }
          }}
        >
          {/* Progress Bar */}
          <div 
            className="h-1 bg-zinc-700 cursor-pointer group relative progress-bar"
            onClick={(e) => {
              e.stopPropagation();
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
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }} 
                className="p-2 bg-white text-black rounded-full hover:bg-zinc-200 transition"
              >
                {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" />}
              </button>
              
              <div 
                className="hidden sm:flex items-center gap-2 w-24 volume-control"
                onClick={(e) => e.stopPropagation()}
              >
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
      )}

      {/* 全螢幕播放器 (手機) / 側邊欄播放器 (桌面) */}
      {isExpanded && (
        <div className="fixed inset-0 lg:right-auto lg:w-[400px] lg:border-r lg:border-zinc-800 bg-zinc-950 text-white z-50 flex flex-col overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300 lg:slide-in-from-left-8">
          {/* 頂部控制 */}
          <div className="p-6 flex justify-end shrink-0">
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X size={32} />
            </button>
          </div>

          {/* 內容區 */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-8 w-full gap-8 lg:gap-12">
            
            {/* 專輯/音樂縮圖 */}
            <div className="w-64 h-64 sm:w-96 sm:h-96 lg:w-64 lg:h-64 bg-zinc-800 rounded-2xl flex items-center justify-center shadow-2xl shrink-0">
              <Music size={80} className="text-zinc-600 lg:scale-75 sm:scale-150" />
            </div>

            {/* 控制面板 */}
            <div className="w-full max-w-3xl lg:max-w-full flex flex-col gap-6 lg:gap-8">
              {/* 音樂資訊 */}
              <div className="text-center sm:text-left lg:text-center">
                <h2 className="text-2xl sm:text-4xl lg:text-2xl font-bold truncate mb-2">{currentTrack.name}</h2>
                <p className="text-zinc-400 text-lg lg:text-base">Playing...</p>
              </div>

              {/* 進度條 */}
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={progress}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="w-full h-1.5 sm:h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all touch-none"
                  style={{ background: `linear-gradient(to right, #3b82f6 ${progressPercent}%, #27272a ${progressPercent}%)` }}
                />
                <div className="flex justify-between text-xs sm:text-sm lg:text-xs text-zinc-400 font-medium">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* 播放控制與音量 */}
              <div className="flex items-center justify-center relative w-full lg:flex-col lg:gap-6">
                
                {/* 播放/暫停按鈕 */}
                <div className="flex items-center gap-4 sm:gap-6 lg:gap-4">
                  <button 
                    onClick={playPrevious}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                    title="上一首"
                  >
                    <SkipBack size={28} className="lg:w-6 lg:h-6" fill="currentColor" />
                  </button>
                  <button 
                    onClick={() => seek(Math.max(0, progress - 10))}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                    title="倒退 10 秒"
                  >
                    <Rewind size={24} className="lg:w-5 lg:h-5" fill="currentColor" />
                  </button>
                  <button 
                    onClick={togglePlay} 
                    className="p-5 sm:p-6 lg:p-4 bg-white text-black rounded-full hover:scale-105 hover:bg-zinc-200 transition-all shadow-xl"
                  >
                    {isPlaying ? <Pause size={32} fill="black" className="lg:w-6 lg:h-6" /> : <Play size={32} fill="black" className="lg:w-6 lg:h-6" />}
                  </button>
                  <button 
                    onClick={() => seek(Math.min(duration || 0, progress + 10))}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                    title="快轉 10 秒"
                  >
                    <FastForward size={24} className="lg:w-5 lg:h-5" fill="currentColor" />
                  </button>
                  <button 
                    onClick={playNext}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                    title="下一首"
                  >
                    <SkipForward size={28} className="lg:w-6 lg:h-6" fill="currentColor" />
                  </button>
                </div>

                {/* 音量控制 (僅限電腦版) */}
                <div className="hidden sm:flex lg:flex items-center gap-4 lg:w-full text-zinc-400 hover:text-white transition-colors lg:static absolute right-0 w-32 md:w-48">
                  <Volume2 size={20} className="shrink-0" />
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume} 
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    style={{ background: `linear-gradient(to right, #3b82f6 ${volume * 100}%, #27272a ${volume * 100}%)` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
