import React from 'react';
import { Icons } from '../Icons';
import { TauriService } from '../../services/tauri';
import { Runner } from '../../types';
import { openUrl } from "@tauri-apps/plugin-opener";

interface SettingsViewProps {
  username: string;
  setUsername: (name: string) => void;
  isLinux: boolean;
  selectedRunner: string;
  setSelectedRunner: (runner: string) => void;
  availableRunners: Runner[];
  musicVol: number;
  setMusicVol: (vol: number) => void;
  sfxVol: number;
  setSfxVol: (vol: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  playSfx: (name: string, multiplier?: number) => void;
  showTeamModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  username,
  setUsername,
  isLinux,
  selectedRunner,
  setSelectedRunner,
  availableRunners,
  musicVol,
  setMusicVol,
  sfxVol,
  setSfxVol,
  isMuted,
  setIsMuted,
  playSfx,
  showTeamModal,
}) => {
  return (
    <div className="w-full max-w-3xl bg-black/80 p-8 md:p-12 border-4 border-black h-full overflow-y-auto no-scrollbar animate-in fade-in">
      <h2 className="text-5xl mb-8 border-b-4 border-white/20 pb-4">Settings</h2>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <label className="text-xl text-slate-400 italic">In-game Username</label>
          <div className="flex gap-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 bg-black border-4 border-slate-700 p-4 text-3xl outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => {
                playSfx('wood click.wav');
                TauriService.saveConfig({
                  username,
                  linuxRunner: selectedRunner || undefined,
                });
              }}
              className="legacy-btn px-8 text-2xl relative"
            >
              Save
            </button>
          </div>
        </div>

        {isLinux && (
          <div className="flex flex-col gap-4">
            <label className="text-xl text-slate-400 italic flex items-center gap-2">
              <Icons.Linux /> Linux Runner
            </label>
            <div className="flex flex-col gap-2">
              <select
                value={selectedRunner}
                onChange={(e) => {
                  playSfx('click.wav');
                  setSelectedRunner(e.target.value);
                }}
                className="w-full legacy-select p-4 text-2xl outline-none focus:border-emerald-500"
              >
                <option value="" disabled>Select a runner...</option>
                {availableRunners.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
              {availableRunners.length === 0 && (
                <p className="text-red-500 text-sm">
                  No Proton or Wine installations found. Please install Steam or Wine.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 bg-[#2a2a2a] p-6 border-4 border-black shadow-[inset_4px_4px_#555]">
          <label className="text-xl flex items-center gap-4">
            <Icons.Volume level={musicVol} /> Audio Controls
          </label>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-sm uppercase opacity-50">
                Music {Math.round(musicVol * 100)}%
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={musicVol}
                onChange={(e) => setMusicVol(parseFloat(e.target.value))}
                className="mc-range"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm uppercase opacity-50">
                SFX {Math.round(sfxVol * 100)}%
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sfxVol}
                onChange={(e) => setSfxVol(parseFloat(e.target.value))}
                className="mc-range"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              playSfx('pop.wav');
            }}
            className="legacy-btn mt-4 py-2"
          >
            {isMuted ? "UNMUTE ALL" : "MUTE ALL"}
          </button>
        </div>

        <div className="about-section border-4 border-black bg-[#2a2a2a] p-6 shadow-[inset_4px_4px_#555]">
          <h3 className="text-2xl text-[#ffff55] mb-2 uppercase tracking-wide">
            About the project
          </h3>
          <p className="text-xl text-white leading-relaxed mb-6 opacity-90">
            This project is proudly maintained by the{' '}
            <span 
              className="text-emerald-400 cursor-pointer hover:underline"
              onClick={() => {
                playSfx('click.wav');
                showTeamModal();
              }}
            >
              Emerald Team
            </span>, with{' '}
            <span className="text-emerald-400">KayJann</span> as the owner.
            Our goal is to create a central hub for the LCE community to bring us all together.
          </p>
          <h3 className="text-sm text-slate-500 mb-4 uppercase tracking-widest">Social Links</h3>
          <div className="flex gap-6">
            <button
              onClick={() => openUrl("https://discord.gg/nzbxB8Hxjh")}
              className="social-btn btn-discord"
              title="Discord"
            >
              <Icons.Discord />
            </button>
            <button
              onClick={() => openUrl("https://github.com/Emerald-Legacy-Launcher/Emerald-Legacy-Launcher")}
              className="social-btn btn-github"
              title="GitHub"
            >
              <Icons.Github />
            </button>
            <button
              onClick={() => openUrl("https://reddit.com/user/KayJann")}
              className="social-btn btn-reddit"
              title="Reddit"
            >
              <Icons.Reddit />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
