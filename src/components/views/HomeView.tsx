import React, { useState } from "react";

// Services
import { GAME_VERSIONS } from "@/services/versions";

// Components
import { SkinViewer } from "@/components/common/SkinViewer";

interface HomeViewProps {
  username: string;
  selectedInstance: string;
  setSelectedInstance: (id: string) => void;
  installedStatus: Record<string, boolean>;
  isRunning: boolean;
  installingInstance: string | null;
  fadeAndLaunch: () => void;
  playSfx: (name: string, multiplier?: number) => void;
  setActiveTab: (tab: string) => void;
  skinBase64?: string;
  gamepadConnected: boolean;
}

const SPLASH_OPTIONS = [
  "Also try Terraria!",
  "Contains zero polygons!",
  "Now with 100% more bugs!",
  "Hello, World!",
  "As seen on TV!",
  "99% Sugar Free!",
  "100% pure Java!",
  "Minceraft!",
  "Feature, not a bug!",
  "Join our Discord!"
];

export const HomeView: React.FC<HomeViewProps> = (props) => {
  const {
    username,
    selectedInstance,
    setSelectedInstance,
    installedStatus,
    isRunning,
    installingInstance,
    fadeAndLaunch,
    playSfx,
    setActiveTab,
    skinBase64,
    gamepadConnected
  } = props;

  const name = username.length > 20 ? `${username.slice(0, 16)}...` : username;
  const [splash, setSplash] = useState(`Welcome, ${name}!`);

  const handleSplashUpdate = () => {
    playSfx("orb.ogg");
    const next = SPLASH_OPTIONS.filter(s => s !== splash);
    setSplash(next[Math.floor(Math.random() * next.length)]);
  };

  const installedVersions = GAME_VERSIONS.filter(v => installedStatus[v.id]);
  const hasGame = installedVersions.length > 0;
  const isLocked = isRunning || !!installingInstance;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-500">

      <div className="absolute top-2 flex flex-col items-center">
        <div className="relative">
          <div 
            className="w-[540px] h-32 bg-contain bg-center bg-no-repeat drop-shadow-2xl select-none"
            style={{ backgroundImage: "var(--menu-title-url)" }}
          />

          <div className="absolute bottom-8 right-6 w-0 h-0 flex items-center justify-center z-20">
            <div
              onClick={handleSplashUpdate}
              className="splash-text text-3xl cursor-pointer hover:brightness-110 active:scale-95 transition-all"
              style={{
                pointerEvents: "auto",
                whiteSpace: "nowrap",
                transformOrigin: "center"
              }}
            >
              {splash}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-12 relative z-10 w-full max-w-6xl">
        <div className="hidden lg:flex flex-col items-center animate-in slide-in-from-left duration-700 relative">
          <div className="relative w-[300px] h-[550px] flex flex-col items-center">
            <div className="absolute top-[60px] z-20 bg-black/40 px-6 py-2 border-2 border-white/10 backdrop-blur-sm">
              <span className="text-2xl legacy-text-shadow opacity-80">{name}</span>
            </div>

            <div className="w-[300px] h-[450px] mt-auto">
              <SkinViewer skinUrl={skinBase64 || null} />
            </div>

            <button
              onClick={() => { playSfx("click.wav"); setActiveTab("skins"); }}
              onMouseEnter={() => playSfx("hover")}
              className="mt-6 group relative flex items-center justify-center w-[200px] h-[48px] transition-transform duration-100 legacy-btn hover:scale-105 shadow-2xl z-30 font-bold"
            >
              <span className="text-[18px] tracking-wider transition-all" style={{ fontFamily: "Minecraft, sans-serif" }}>
                Change Skin
              </span>
            </button>
          </div>
        </div>

        <div className="w-[600px] p-10 bg-black/60 backdrop-blur-[var(--backdrop-blur)] border-[var(--border-width)] border-[var(--border-secondary)] shadow-2xl rounded-[var(--radius-base)]">
          {hasGame ? (
            <div className="flex flex-col gap-8">
              <select
                value={selectedInstance}
                onChange={(e) => {
                  playSfx("click.wav");
                  setSelectedInstance(e.target.value);
                }}
                className="w-full legacy-select p-3 text-2xl outline-none cursor-pointer"
              >
                {installedVersions.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>

              <button
                onClick={fadeAndLaunch}
                disabled={isLocked}
                onMouseEnter={() => playSfx("hover")}
                className={`h-20 text-4xl transition-all legacy-btn flex items-center justify-center gap-4 ${isLocked
                  ? "opacity-50 grayscale cursor-default"
                  : "hover:scale-[1.02] active:scale-95 cursor-pointer"
                  }`}
              >
                {gamepadConnected && !isLocked && (
                  <img src="/images/ButtonA.png" className="w-10 h-10 animate-pulse" alt="A" />
                )}
                <span>{installingInstance ? "INSTALLING..." : isRunning ? "RUNNING..." : "PLAY"}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <h2 className="text-3xl text-red-500 legacy-text-shadow uppercase">Missing Game Files</h2>
              <button
                onClick={() => { playSfx("click.wav"); setActiveTab("versions"); }}
                className="w-3/4 h-16 text-2xl legacy-btn active:scale-95 transition-all"
              >
                Check Versions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};