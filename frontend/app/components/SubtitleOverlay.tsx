import { usePlayer } from "../contexts/PlayerContext";

export function SubtitleOverlay() {
  const { currentSubtitle } = usePlayer();

  if (!currentSubtitle) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 pointer-events-none z-40 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p 
          className="inline-block text-xl md:text-2xl font-bold text-white px-4 py-2 rounded-lg bg-black/60 backdrop-blur-md shadow-lg"
          style={{ textShadow: "1px 1px 2px black" }}
        >
          {currentSubtitle}
        </p>
      </div>
    </div>
  );
}
