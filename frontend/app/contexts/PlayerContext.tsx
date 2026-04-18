import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

interface Track {
  id: number;
  name: string;
  path: string;
  type_id: number;
  parent_id: number;
}

interface SubtitleLine {
  start: number;
  end: number;
  text: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  currentSubtitle: string;
  isExpanded: boolean;
  play: (track: Track) => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setIsExpanded: (expanded: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const subtitlesRef = useRef<SubtitleLine[]>([]);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    
    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      if (subtitlesRef.current.length > 0) {
        const activeLine = subtitlesRef.current.find(
          (line) => audio.currentTime >= line.start && audio.currentTime <= line.end
        );
        setCurrentSubtitle(activeLine ? activeLine.text : "");
      }
    };

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
    };
  }, []); // Only on mount

  // Sync subtitles to ref
  useEffect(() => {
    subtitlesRef.current = subtitles;
  }, [subtitles]);

  useEffect(() => {
    if (currentTrack && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: "Music Player",
        album: "My Collection",
      });

      navigator.mediaSession.setActionHandler("play", () => play(currentTrack));
      navigator.mediaSession.setActionHandler("pause", pause);
      navigator.mediaSession.setActionHandler("stop", pause);
      navigator.mediaSession.setActionHandler("seekbackward", () => seek(audioRef.current!.currentTime - 10));
      navigator.mediaSession.setActionHandler("seekforward", () => seek(audioRef.current!.currentTime + 10));
    }
  }, [currentTrack]);

  const fetchSubtitles = async (trackId: number) => {
    try {
      const res = await fetch(`${API_URL}/files/subtitle/${trackId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const text = await res.text();
        parseSubtitles(text);
      } else {
        setSubtitles([]);
      }
    } catch (e) {
      setSubtitles([]);
    }
  };

  const parseSubtitles = (text: string) => {
    // Basic VTT parser
    const lines: SubtitleLine[] = [];
    const blocks = text.split(/\r?\n\r?\n/);
    blocks.forEach((block) => {
      const match = block.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\r?\n([\s\S]+)/);
      if (match) {
        lines.push({
          start: timeToSeconds(match[1]),
          end: timeToSeconds(match[2]),
          text: match[3].replace(/<[^>]+>/g, ""),
        });
      }
    });
    setSubtitles(lines);
  };

  const timeToSeconds = (timeStr: string) => {
    const [h, m, s] = timeStr.split(":");
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
  };

  const play = (track: Track) => {
    setCurrentTrack(track);
    
    setIsExpanded((prev) => {
      if (!prev && window.innerWidth < 1024) {
        window.history.pushState({ playerExpanded: true }, "");
      }
      return true;
    });
    
    const targetSrc = `${API_URL}/files/music/${track.id}?token=${token}`;
    
    // Check if the src needs to be updated. This handles HMR correctly 
    // where the Audio object is recreated but currentTrack remains the same.
    if (!audioRef.current!.src || !audioRef.current!.src.includes(`/files/music/${track.id}`)) {
      audioRef.current!.src = targetSrc;
      fetchSubtitles(track.id);
    }
    
    audioRef.current!.play().catch((err) => console.error("Audio playback failed:", err));
  };

  const pause = () => audioRef.current?.pause();
  const togglePlay = () => (isPlaying ? pause() : audioRef.current?.play());
  const seek = (time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  };
  const setVolume = (v: number) => {
    if (audioRef.current) {
      audioRef.current.volume = v;
      setVolumeState(v);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        currentSubtitle,
        isExpanded,
        play,
        pause,
        togglePlay,
        seek,
        setVolume,
        setIsExpanded,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
