import React from 'react';
import { TauriService } from '../../services/tauri';
import { Runner } from '../../types';

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
      <img src="/images/MenuTitle.png" className="w-[500px] mb-12" alt="Menu Title" />
      <div className="bg-[#2a2a2a] p-10 border-4 border-black w-full max-w-2xl text-center shadow-[inset_4px_4px_#555,inset_-4px_-4px_#111]">
        <h2 className="text-4xl text-emerald-400 mb-4">Welcome to Emerald Legacy!</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-black border-4 border-emerald-900 p-4 text-3xl text-center mb-8 outline-none"
          placeholder="Username..."
        />
        <button
          onClick={() => {
            ensureAudio();
            playSfx('click.wav');
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
