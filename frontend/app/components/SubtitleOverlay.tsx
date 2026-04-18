import { useState, useEffect, useRef } from "react";
import { usePlayer } from "../contexts/PlayerContext";

export function SubtitleOverlay() {
  const { currentSubtitle } = usePlayer();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling while dragging
      const touch = e.touches[0];
      const movementX = touch.clientX - dragStartPos.current.x;
      const movementY = touch.clientY - dragStartPos.current.y;
      
      setPosition((prev) => ({
        x: prev.x + movementX,
        y: prev.y + movementY,
      }));
      
      dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // For mouse
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    
    // For touch
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  if (!currentSubtitle) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 pointer-events-none z-[100] flex justify-center px-4">
      <div 
        className={`pointer-events-auto touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={(e) => {
          setIsDragging(true);
          dragStartPos.current = { 
            x: e.touches[0].clientX, 
            y: e.touches[0].clientY 
          };
        }}
      >
        <p 
          className="inline-block text-xl md:text-2xl font-bold text-white px-4 py-2 rounded-lg bg-black/60 backdrop-blur-md shadow-lg select-none"
          style={{ textShadow: "1px 1px 2px black" }}
        >
          {currentSubtitle}
        </p>
      </div>
    </div>
  );
}
