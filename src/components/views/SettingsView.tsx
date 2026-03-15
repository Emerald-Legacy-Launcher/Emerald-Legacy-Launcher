import React, { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
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

const DOWNLOADABLE_RUNNERS = [
  { name: "wine-11.4", label: "WINE 11.4", url: "https://github.com/Kron4ek/Wine-Builds/releases/download/11.4/wine-11.4-amd64.tar.xz" },
  { name: "proton-10.0", label: "Proton 10.0", url: "https://github.com/Kron4ek/proton-archive/releases/download/10.0/proton-10.0-1.tar.xz" },
  { name: "proton-9.0-3", label: "Proton 9.0-3", url: "https://github.com/Kron4ek/proton-archive/releases/download/9.0/proton-9.0-3.tar.xz" },
];

interface SettingsViewProps {
  username: string;
  setUsername: (name: string) => void;
  isLinux: boolean;
  isMac: boolean;
  selectedRunner: string;
  setSelectedRunner: (runner: string) => void;
  availableRunners: Runner[];
  setAvailableRunners: (runners: Runner[]) => void;
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
  macosCompatReady: boolean;
  setMacosCompatReady: (ready: boolean) => void;
  appleSiliconPerformanceBoost: boolean;
  setAppleSiliconPerformanceBoost: (enabled: boolean) => void;
  saveConfig: (overrides: Partial<AppConfig>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  username,
  setUsername,
  isLinux,
  isMac,
  selectedRunner,
  setSelectedRunner,
  availableRunners,
  setAvailableRunners,
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
  macosCompatReady,
  setMacosCompatReady,
  appleSiliconPerformanceBoost,
  setAppleSiliconPerformanceBoost,
  saveConfig
}) => {
  const { setStyle, setPalette, availablePalettes, refreshPalettes } = useTheme();
  const [showRunnerPanel, setShowRunnerPanel] = useState(false);
  const [downloadingRunner, setDownloadingRunner] = useState<string | null>(null);
  const [runnerProgress, setRunnerProgress] = useState(0);
  const [runnerError, setRunnerError] = useState<string | null>(null);

  interface MacosSetupProgressPayload {
    stage: string;
    message: string;
    percent?: number | null;
  }

  const [macSetupInProgress, setMacSetupInProgress] = useState(false);
  const [macSetupStage, setMacSetupStage] = useState<string>("idle");
  const [macSetupMessage, setMacSetupMessage] = useState<string>("");
  const [macSetupProgress, setMacSetupProgress] = useState<number>(0);
  const [macSetupError, setMacSetupError] = useState<string | null>(null);

  useEffect(() => {
    const unlisten = listen<number>("runner-download-progress", (e) =>
      setRunnerProgress(Math.round(e.payload))
    );
    return () => { unlisten.then((f) => f()); };
  }, []);

  useEffect(() => {
    const unlisten = listen<MacosSetupProgressPayload>("macos-setup-progress", (e) => {
      setMacSetupStage(e.payload.stage);
      setMacSetupMessage(e.payload.message);
      if (typeof e.payload.percent === "number") {
        setMacSetupProgress(Math.round(e.payload.percent));
      }
    });
    return () => { unlisten.then((f) => f()); };
  }, []);

  const handleDownloadRunner = async (name: string, url: string) => {
    setDownloadingRunner(name);
    setRunnerProgress(0);
    setRunnerError(null);
    try {
      await TauriService.downloadRunner(name, url);
      playSfx("orb.ogg");
      const runners = await TauriService.getAvailableRunners();
      setAvailableRunners(runners);
      const downloaded = runners.find((r) => r.id === `downloaded_${name}`);
      if (downloaded) {
        setSelectedRunner(downloaded.id);
        saveConfig({ linuxRunner: downloaded.id });
      }
    } catch (e: any) {
      if (e !== "CANCELLED") {
        setRunnerError(String(e));
      }
    }
    setDownloadingRunner(null);
    setShowRunnerPanel(false);
  };

  const handleSetupMacosCompatibility = async () => {
    setMacSetupInProgress(true);
    setMacSetupError(null);
    setMacSetupProgress(0);
    setMacSetupStage("starting");
    setMacSetupMessage("Démarrage du setup…");
    try {
      await TauriService.setupMacosRuntime();
      setMacosCompatReady(true);
      setMacSetupProgress(100);
      setMacSetupStage("done");
      setMacSetupMessage("Setup terminé.");
      playSfx("orb.ogg");
    } catch (e: any) {
      setMacSetupError(String(e));
      setMacSetupStage("error");
    } finally {
      setMacSetupInProgress(false);
    }
  };

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

            <button
              onClick={() => {
                playSfx("click.wav");
                setShowRunnerPanel(!showRunnerPanel);
                setRunnerError(null);
              }}
              className="legacy-btn py-3 text-xl uppercase tracking-wide"
              disabled={!!downloadingRunner}
            >
              {showRunnerPanel ? "Hide Downloads" : "Download a Runner"}
            </button>

            {showRunnerPanel && (
              <div className="flex flex-col gap-3 bg-[var(--bg-secondary)] p-5 border-[var(--border-width)] border-[var(--border-primary)] shadow-[inset_calc(4px*var(--shadow-intensity))_calc(4px*var(--shadow-intensity))_var(--border-secondary)] rounded-[var(--radius-base)]">
                <span className="text-sm uppercase opacity-50 tracking-widest">Available Downloads</span>
                {DOWNLOADABLE_RUNNERS.map((dr) => (
                  <div key={dr.name} className="flex items-center justify-between gap-4">
                    <span className="text-lg flex-1">{dr.label}</span>
                    {downloadingRunner === dr.name ? (
                      <div className="flex-1 max-w-[200px]">
                        <div className="mc-progress-container">
                          <div
                            className="mc-progress-bar"
                            style={{ width: `${runnerProgress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 mt-1 block text-center">{runnerProgress}%</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          playSfx("wood click.wav");
                          handleDownloadRunner(dr.name, dr.url);
                        }}
                        className="legacy-btn px-5 py-2 text-base"
                        disabled={!!downloadingRunner}
                      >
                        {availableRunners.some((r) => r.id === `downloaded_${dr.name}`) ? "Re-download" : "Download"}
                      </button>
                    )}
                  </div>
                ))}
                {runnerError && (
                  <p className="text-red-500 text-sm mt-1">{runnerError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {isMac && (
          <div className="flex flex-col gap-4 bg-[var(--bg-secondary)] p-6 border-[var(--border-width)] border-[var(--border-primary)] shadow-[inset_calc(4px*var(--shadow-intensity))_calc(4px*var(--shadow-intensity))_var(--border-secondary)] rounded-[var(--radius-base)]">
            <label className="text-xl text-slate-400 italic">macOS Compatibility</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-lg">
                  Status: {macosCompatReady ? "Installed" : "Not installed"}
                </span>
                <button
                  onClick={() => {
                    playSfx("wood click.wav");
                    handleSetupMacosCompatibility();
                  }}
                  className="legacy-btn px-5 py-2 text-base"
                  disabled={macSetupInProgress}
                >
                  {macosCompatReady ? "Re-run Setup" : "Setup macOS Compatibility"}
                </button>
              </div>

              {(macSetupInProgress || macSetupStage !== "idle") && (
                <div className="mt-2">
                  <div className="mc-progress-container">
                    <div className="mc-progress-bar" style={{ width: `${macSetupProgress}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">{macSetupMessage}</span>
                    <span className="text-xs text-slate-400">{macSetupProgress}%</span>
                  </div>
                </div>
              )}

              {macSetupError && (
                <p className="text-red-500 text-sm mt-2">{macSetupError}</p>
              )}
            </div>
          </div>
        )}

        {isMac && (
          <div className="flex flex-col gap-4 bg-[var(--bg-secondary)] p-6 border-[var(--border-width)] border-[var(--border-primary)] shadow-[inset_calc(4px*var(--shadow-intensity))_calc(4px*var(--shadow-intensity))_var(--border-secondary)] rounded-[var(--radius-base)]">
            <label className="text-xl text-slate-400 italic">macOS Optimization</label>
            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col">
                <span className="text-lg">Apple Silicon Performance Boost (Experimental)</span>
                <span className="text-xs text-slate-400">
                  Active des variables Wine/Metal agressives (Apple Silicon uniquement).
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !appleSiliconPerformanceBoost;
                  setAppleSiliconPerformanceBoost(next);
                  playSfx("wood click.wav");
                  saveConfig({ appleSiliconPerformanceBoost: next });
                }}
                className="legacy-btn px-6 py-2 min-w-[140px] transition-all"
                style={{
                  backgroundColor: appleSiliconPerformanceBoost ? "var(--accent-primary)" : "var(--btn-bg)",
                  color: appleSiliconPerformanceBoost ? "#ffffff" : "var(--btn-text)"
                }}
              >
                {appleSiliconPerformanceBoost ? "ENABLED" : "DISABLED"}
              </button>
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
