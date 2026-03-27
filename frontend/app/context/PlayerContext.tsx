"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { WebVTTParser } from 'webvtt-parser';

interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

interface PlayerContextType {
  currentSong: string | null; // 現在是相對於 backend/music 的路徑
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  currentSubtitle: string | null;
  playSong: (songPath: string) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => {
      setIsPlaying(true);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };
    const handlePause = () => {
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
    };
  }, []);

  // 當前歌曲改變時，獲取字幕
  useEffect(() => {
    if (currentSong) {
      // 獲取字幕
      fetch(`http://localhost:8000/captions/${encodeURIComponent(currentSong)}`)
        .then(res => {
          if (!res.ok) throw new Error('No subtitle');
          return res.text();
        })
        .then(vttText => {
          const parser = new WebVTTParser();
          const tree = parser.parse(vttText);
          
          if (tree.errors.length > 0) {
            console.warn('Subtitle parsing errors:', tree.errors);
          }
          
          setSubtitles(tree.cues.map((cue: any) => ({
            startTime: cue.startTime,
            endTime: cue.endTime,
            text: cue.text
          })));
        })
        .catch(() => {
          setSubtitles([]);
          setCurrentSubtitle(null);
        });

      // Media Session Metadata
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSong.split('/').pop() || currentSong,
          artist: 'PlayerWeb',
          album: 'Local Music',
          artwork: [
            { src: '/next.svg', sizes: '512x512', type: 'image/svg+xml' },
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => {
          audioRef.current?.play();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          audioRef.current?.pause();
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && audioRef.current) {
            audioRef.current.currentTime = details.seekTime;
          }
        });
      }
    }
  }, [currentSong]);

  // 每當時間更新，計算當前應顯示的字幕
  useEffect(() => {
    if (subtitles.length > 0) {
      const active = subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
      setCurrentSubtitle(active ? active.text : null);
    } else {
      setCurrentSubtitle(null);
    }
  }, [currentTime, subtitles]);

  const playSong = (songPath: string) => {
    if (currentSong === songPath) {
      togglePlay();
      return;
    }
    setCurrentSong(songPath);
    if (audioRef.current) {
      // Backend URL - 使用完整的路徑
      audioRef.current.src = `http://localhost:8000/stream/${encodeURIComponent(songPath)}`;
      audioRef.current.play().catch(console.error);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const setVolume = (vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  return (
    <PlayerContext.Provider value={{ 
      currentSong, 
      isPlaying, 
      duration, 
      currentTime, 
      currentSubtitle,
      playSong, 
      togglePlay, 
      seek, 
      setVolume 
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
