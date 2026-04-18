import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { PlayerProvider } from "../contexts/PlayerContext";
import { MiniPlayer } from "../components/MiniPlayer";
import { SubtitleOverlay } from "../components/SubtitleOverlay";

export default function MainLayout() {
  return (
    <PlayerProvider>
      <Outlet />
      <SubtitleOverlay />
      <MiniPlayer />
    </PlayerProvider>
  );
}
