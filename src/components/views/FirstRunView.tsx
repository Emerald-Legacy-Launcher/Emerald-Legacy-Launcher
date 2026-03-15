import React from "react";

// Services
import { TauriService } from "@/services/tauri";

// Types
import { Runner } from "@/types";

interface FirstRunViewProps {
  username: string;
  setUsername: (name: string) => void;
  isLinux: boolean;
  selectedRunner: string;
  availableRunners: Runner[];
  setIsFirstRun: (val: boolean) => void;
  playRandomMusic: () => void;
  playSfx: (name: string, multiplier?: number) => void;
  ensureAudio: () => void;
}

export const FirstRunView: React.FC<FirstRunViewProps> = ({
  username,
  setUsername,
  isLinux,
  selectedRunner,
  availableRunners,
  setIsFirstRun,
  playRandomMusic,
  playSfx,
  ensureAudio,
}) => {
  return (
    <div
      className="h-screen flex flex-col items-center justify-center bg-black text-white p-12 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        className="w-[500px] h-32 bg-contain bg-center bg-no-repeat mb-12"
        style={{ backgroundImage: "var(--menu-title-url)" }}
      />
      <div className="bg-[#2a2a2a]/80 p-10 border-[var(--border-width)] border-[var(--border-primary)] w-full max-w-2xl text-center shadow-[inset_calc(4px*var(--shadow-intensity))_calc(4px*var(--shadow-intensity))_#555] rounded-[var(--radius-base)] backdrop-blur-[var(--backdrop-blur)]">
        <h2 className="text-4xl text-emerald-400 mb-4">Welcome to Emerald Legacy!</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-black border-[var(--border-width)] border-[var(--accent-primary)] p-4 text-3xl text-center mb-8 outline-none rounded-[var(--radius-base)]"
          placeholder="Username..."
        />
        <button
          onClick={() => {
            ensureAudio();
            playSfx("click.wav");
            TauriService.saveConfig({
              username,
              linuxRunner: isLinux ? selectedRunner : undefined,
            });
            setIsFirstRun(false);
            setTimeout(playRandomMusic, 500);
          }}
          disabled={!username.trim() || (isLinux && availableRunners.length === 0)}
          className="legacy-btn py-4 px-12 text-3xl w-full"
        >
          Start Setup
        </button>
      </div>
    </div>
  );
};
