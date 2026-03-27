import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "./context/PlayerContext";
import MiniPlayer from "./components/MiniPlayer";
import SubtitleOverlay from "./components/SubtitleOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlayerWeb - Music Streamer",
  description: "High quality local music streaming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-black text-black dark:text-white">
        <PlayerProvider>
          <div className="flex-1 pb-24"> {/* pb-24 to make space for MiniPlayer */}
            {children}
          </div>
          <SubtitleOverlay />
          <MiniPlayer />
        </PlayerProvider>
      </body>
    </html>
  );
}
