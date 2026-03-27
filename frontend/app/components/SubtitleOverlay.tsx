"use client";

import React from 'react';
import { usePlayer } from '../context/PlayerContext';

export default function SubtitleOverlay() {
  const { currentSubtitle } = usePlayer();

  if (!currentSubtitle) return null;

  return (
    <div className="fixed bottom-28 left-0 right-0 flex justify-center pointer-events-none z-40 px-4">
      <div className="bg-black/80 text-white px-6 py-3 rounded-xl text-lg md:text-xl font-medium max-w-3xl text-center shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 border border-white/10">
        {currentSubtitle}
      </div>
    </div>
  );
}
