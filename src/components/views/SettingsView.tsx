import React from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTheme } from "@/components/theme/ThemeContext";
import { THEME_STYLES } from "@/types/theme";
import { AppConfig } from "@/types";

// Icons
import { Icons } from "@/components/Icons";

// Services
import { TauriService } from "@/services/tauri";

// Types
import { Runner } from "@/types";

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
  showClickParticles: boolean;
  setShowClickParticles: (show: boolean) => void;
  playSfx: (name: string, multiplier?: number) => void;
  showTeamModal: () => void;
  showPanorama: boolean;
  setShowPanorama: (show: boolean) => void;
  themeStyleId: string;
  setThemeStyleId: (id: string) => void;
  themePaletteId: string;
  setThemePaletteId: (id: string) => void;
  saveConfig: (overrides: Partial<AppConfig>) => void;
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
  showClickParticles,
  setShowClickParticles,
  playSfx,
  showTeamModal,
  showPanorama,
  setShowPanorama,
  themeStyleId,
  setThemeStyleId,
  themePaletteId,
  setThemePaletteId,
  saveConfig
}) => {
  const { setStyle, setPalette, availablePalettes, refreshPalettes } = useTheme();

  return (
    <div className="w-full max-w-3xl bg-[var(--bg-primary)] p-8 md:p-12 border-[var(--border-width)] border-[var(--border-primary)] h-full overflow-y-auto no-scrollbar animate-in fade-in rounded-[var(--radius-base)] shadow-2xl">
      <h2 className="text-5xl mb-8 border-b-[var(--border-width)] border-[var(--border-secondary)] pb-4">Settings</h2>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <label className="text-xl text-slate-400 italic">In-game Username</label>
          <div className="flex gap-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 bg-black border-[var(--border-width)] border-[var(--border-secondary)] p-4 text-3xl outline-none focus:border-[var(--accent-primary)] rounded-[var(--radius-base)]"
            />
            <button
              onClick={() => {
                playSfx("wood click.wav");
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
                  const newRunner = e.target.value;
                  playSfx("click.wav");
                  setSelectedRunner(newRunner);
                  TauriService.saveConfig({
                    username,
                    linuxRunner: newRunner || undefined,
                  });
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

        <div className="flex flex-col gap-4 bg-[var(--bg-secondary)] p-6 border-[var(--border-width)] border-[var(--border-primary)] shadow-[inset_calc(4px*var(--shadow-intensity))_calc(4px*var(--shadow-intensity))_var(--border-secondary)] rounded-[var(--radius-base)]">
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
              playSfx("pop.wav");
            }}
            className="legacy-btn mt-4 py-2"
          >
            {isMuted ? "UNMUTE ALL" : "MUTE ALL"}
          </button>
        </div>

        <div className="flex flex-col gap-4 bg-[var(--bg-tertiary)] p-6 border-[var(--border-width)] border-[var(--border-primary)] shadow-[inset_calc(4px*var(--shadow-intensity))_calc(4px*var(--shadow-intensity))_var(--btn-shadow-light)] rounded-[var(--radius-base)]">
          <label className="text-xl flex items-center gap-4">
            Visual Effects
          </label>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xl">UI Style</span>
              <select
                value={themeStyleId}
                onChange={(e) => {
                  const newStyleId = e.target.value;
                  playSfx("click.wav");
                  setThemeStyleId(newStyleId);
                  setStyle(newStyleId);
                  saveConfig({ themeStyleId: newStyleId, themePaletteId });
                }}
                className="w-full legacy-select p-4 text-2xl outline-none focus:border-[var(--accent-primary)]"
              >
                {THEME_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xl">Color Palette</span>
              <select
                value={themePaletteId}
                onChange={(e) => {
                  const newPaletteId = e.target.value;
                  playSfx("click.wav");
                  setThemePaletteId(newPaletteId);
                  setPalette(newPaletteId);
                  saveConfig({ themeStyleId, themePaletteId: newPaletteId });
                }}
                className="w-full legacy-select p-4 text-2xl outline-none focus:border-[var(--accent-primary)]"
              >
                {availablePalettes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  try {
                    const name = await TauriService.importTheme();
                    if (name !== "CANCELED") {
                      playSfx("wood click.wav");
                      await refreshPalettes();
                    }
                  } catch (e) {
                    console.error("Import failed:", e);
                  }
                }}
                className="legacy-btn mt-2 py-2 text-sm uppercase"
              >
                Import Theme JSON
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xl">Click Visual Effect</span>
              <button
                onClick={() => {
                  setShowClickParticles(!showClickParticles);
                  playSfx("wood click.wav");
                }}
                className="legacy-btn px-6 py-2 min-w-[120px] transition-all"
                style={{ 
                  backgroundColor: showClickParticles ? "var(--accent-primary)" : "var(--btn-bg)",
                  color: showClickParticles ? "#ffffff" : "var(--btn-text)"
                }}
              >
                {showClickParticles ? "ENABLED" : "DISABLED"}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl">Panorama Background</span>
              <button
                onClick={() => {
                  setShowPanorama(!showPanorama);
                  playSfx("wood click.wav");
                }}
                className="legacy-btn px-6 py-2 min-w-[120px] transition-all"
                style={{ 
                  backgroundColor: showPanorama ? "var(--accent-primary)" : "var(--btn-bg)",
                  color: showPanorama ? "#ffffff" : "var(--btn-text)"
                }}
              >
                {showPanorama ? "ENABLED" : "DISABLED"}
              </button>
            </div>
            <p className="text-sm text-slate-400 italic">
              Disabling this will replace the animated background with a solid color.
            </p>
          </div>
        </div>

        <div className="about-section border-[var(--border-width)] border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 shadow-[inset_calc(4px*var(--shadow-intensity))_calc(4px*var(--shadow-intensity))_var(--border-secondary)] rounded-[var(--radius-base)]">
          <h3 className="text-2xl text-[#ffff55] mb-2 uppercase tracking-wide">
            About the project
          </h3>
          <p className="text-xl text-white leading-relaxed mb-6 opacity-90">
            This project is proudly maintained by the{" "}
            <span
              className="text-emerald-400 cursor-pointer hover:underline"
              onClick={() => {
                playSfx("click.wav");
                showTeamModal();
              }}
            >
              Emerald Team
            </span>, with{" "}
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
