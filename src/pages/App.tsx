import { useState, useEffect } from "react";
import "@/css/index.css";

// Hooks
import { useAudio } from "@/hooks/useAudio";
import { useSettings } from "@/hooks/useSettings";
import { useGameInstances } from "@/hooks/useGameInstances";
import { useLauncher } from "@/hooks/useLauncher";
import { useGamepad } from "@/hooks/useGamepad";

// Services
import { TauriService } from "@/services/tauri";
import { getVersionById } from "@/services/versions";
import RPC from "@/services/RPC";

// Types
import { AppConfig, Runner, ReinstallModalData, McNotification, SkinLibraryItem } from "@/types/index";

// Components
import { ThemeProvider } from "@/components/theme/ThemeContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { HomeView } from "@/components/views/HomeView";
import { VersionsView } from "@/components/views/VersionsView";
import { SettingsView } from "@/components/views/SettingsView";
import { SkinsView } from "@/components/views/SkinsView";
import { FirstRunView } from "@/components/views/FirstRunView";
import { ReinstallModal } from "@/components/modals/ReinstallModal";
import { TeamModal } from "@/components/modals/TeamModal";
import { Notification } from "@/components/common/Notification";
import { PanoramaBackground } from "@/components/common/PanoramaBackground";
import { ClickParticles } from "@/components/common/ClickParticles";
// import { listen } from '@tauri-apps/api/event';

export default function App() {
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<string>("vanilla_tu19");
  const [reinstallModal, setReinstallModal] = useState<ReinstallModalData | null>(null);
  const [mcNotif, setMcNotif] = useState<McNotification | null>(null);
  const [availableRunners, setAvailableRunners] = useState<Runner[]>([]);
  const [selectedRunner, setSelectedRunner] = useState<string>("");
  const [isLinux, setIsLinux] = useState(false);
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [skinBase64, setSkinBase64] = useState<string | undefined>(undefined);
  const [skinLibrary, setSkinLibrary] = useState<SkinLibraryItem[]>([]);

  const {
    musicVol, setMusicVol,
    sfxVol, setSfxVol,
    isMuted, setIsMuted,
    showClickParticles, setShowClickParticles,
    showPanorama, setShowPanorama,
    themeStyleId, setThemeStyleId,
    themePaletteId, setThemePaletteId
  } = useSettings();
  const { musicRef, playRandomMusic, playSfx, ensureAudio } = useAudio(musicVol, sfxVol, isMuted);
  const { installedStatus, installingInstance, downloadProgress, executeInstall, updateAllStatus } = useGameInstances(playSfx, setMcNotif);
  const { isRunning, fadeAndLaunch } = useLauncher(selectedInstance, musicRef, isMuted, musicVol, playRandomMusic, playSfx);
  const { connected: gamepadConnected } = useGamepad(activeTab, setActiveTab, playSfx);
  useEffect(() => {
    const initApp = async () => {
      const config = await TauriService.loadConfig() as AppConfig;

      if (config.username?.trim()) {
        setUsername(config.username);
        setIsFirstRun(false);
        setTimeout(playRandomMusic, 1000);
      }

      if (config.linuxRunner) {
        setSelectedRunner(config.linuxRunner);
      }

      if (config.skinBase64) {
        setSkinBase64(config.skinBase64);
      }

      if (config.skinLibrary) {
        setSkinLibrary(config.skinLibrary);
      }

      const platform = window.navigator.platform.toLowerCase();
      if (platform.includes("linux")) {
        setIsLinux(true);
        const runners = await TauriService.getAvailableRunners();
        setAvailableRunners(runners);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    const updateRPC = async () => {
      if (isFirstRun || !username) return;

      const version = getVersionById(selectedInstance);
      const versionName = version ? version.name : "Unknown Version";

      let details = "In Menus";
      let state = `Playing as ${username}`;

      if (isRunning) {
        details = `Playing ${versionName}`;
      } else {
        const tabNames: Record<string, string> = {
          home: "Main Menu",
          versions: "Selecting Version",
          settings: "In Settings"
        };
        details = tabNames[activeTab] || "In Menus";
      }

      await RPC.updateActivity(details, state, isRunning);
    };

    updateRPC();
  }, [username, isRunning, selectedInstance, activeTab, isFirstRun]);

  const saveFullConfig = (overrides: Partial<AppConfig> = {}) => {
    const config: AppConfig = {
      username: overrides.username !== undefined ? overrides.username : username,
      linuxRunner: (overrides.linuxRunner !== undefined ? overrides.linuxRunner : selectedRunner) || undefined,
      skinBase64: overrides.skinBase64 !== undefined ? overrides.skinBase64 : skinBase64,
      skinLibrary: overrides.skinLibrary !== undefined ? overrides.skinLibrary : skinLibrary,
      themeStyleId: overrides.themeStyleId !== undefined ? overrides.themeStyleId : themeStyleId,
      themePaletteId: overrides.themePaletteId !== undefined ? overrides.themePaletteId : themePaletteId,
    };
    TauriService.saveConfig(config);
  };

  const addSkinToLibrary = (name: string, base64: string) => {
    const newItem: SkinLibraryItem = {
      id: crypto.randomUUID(),
      name,
      skinBase64: base64
    };
    const newLibrary = [...skinLibrary, newItem];
    setSkinLibrary(newLibrary);
    saveFullConfig({ skinLibrary: newLibrary });
  };

  const renameSkinInLibrary = (id: string, newName: string) => {
    const newLibrary = skinLibrary.map(item => item.id === id ? { ...item, name: newName } : item);
    setSkinLibrary(newLibrary);
    saveFullConfig({ skinLibrary: newLibrary });
  };

  const deleteSkinFromLibrary = (id: string) => {
    const newLibrary = skinLibrary.filter(item => item.id !== id);
    setSkinLibrary(newLibrary);
    saveFullConfig({ skinLibrary: newLibrary });
  };

  const selectSkin = (base64: string) => {
    setSkinBase64(base64);
    saveFullConfig({ skinBase64: base64 });
  };

  if (isFirstRun) {
    return (
      <FirstRunView
        username={username}
        setUsername={setUsername}
        isLinux={isLinux}
        selectedRunner={selectedRunner}
        availableRunners={availableRunners}
        setIsFirstRun={setIsFirstRun}
        playRandomMusic={playRandomMusic}
        playSfx={playSfx}
        ensureAudio={ensureAudio}
      />
    );
  }

  return (
    <ThemeProvider>
      <div className="h-screen flex select-none overflow-hidden bg-black text-white" onContextMenu={(e) => e.preventDefault()}>
        {showClickParticles && <ClickParticles />}
        <audio ref={musicRef} onEnded={playRandomMusic} />

        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          playSfx={playSfx}
          updateAllStatus={updateAllStatus}
          installingInstance={installingInstance}
          downloadProgress={downloadProgress}
          showTeamModal={() => setTeamModalVisible(true)}
          gamepadConnected={gamepadConnected}
        />

        <main className="flex-1 relative h-full flex flex-col overflow-hidden">
          {showPanorama && <PanoramaBackground />}

          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10 overflow-hidden w-full">
            {activeTab === "home" && (
              <HomeView
                username={username}
                selectedInstance={selectedInstance}
                setSelectedInstance={setSelectedInstance}
                installedStatus={installedStatus}
                isRunning={isRunning}
                installingInstance={installingInstance}
                fadeAndLaunch={fadeAndLaunch}
                playSfx={playSfx}
                setActiveTab={setActiveTab}
                skinBase64={skinBase64}
                gamepadConnected={gamepadConnected}
              />
            )}

            {activeTab === "versions" && (
              <VersionsView
                installedStatus={installedStatus}
                installingInstance={installingInstance}
                executeInstall={executeInstall}
                setReinstallModal={setReinstallModal}
                playSfx={playSfx}
              />
            )}

            {activeTab === "skins" && (
              <SkinsView
                skinBase64={skinBase64}
                skinLibrary={skinLibrary}
                playSfx={playSfx}
                onSelectSkin={selectSkin}
                onAddSkin={addSkinToLibrary}
                onRenameSkin={renameSkinInLibrary}
                onDeleteSkin={deleteSkinFromLibrary}
                gamepadConnected={gamepadConnected}
              />
            )}

            {activeTab === "settings" && (
              <SettingsView
                username={username}
                setUsername={setUsername}
                isLinux={isLinux}
                selectedRunner={selectedRunner}
                setSelectedRunner={setSelectedRunner}
                availableRunners={availableRunners}
                musicVol={musicVol}
                setMusicVol={setMusicVol}
                sfxVol={sfxVol}
                setSfxVol={setSfxVol}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                showClickParticles={showClickParticles}
                setShowClickParticles={setShowClickParticles}
                playSfx={playSfx}
                showTeamModal={() => setTeamModalVisible(true)}
                showPanorama={showPanorama}
                setShowPanorama={setShowPanorama}
                themeStyleId={themeStyleId}
                setThemeStyleId={setThemeStyleId}
                themePaletteId={themePaletteId}
                setThemePaletteId={setThemePaletteId}
                saveConfig={saveFullConfig}
              />
            )}
          </div>

          {reinstallModal && (
            <ReinstallModal
              data={reinstallModal}
              onCancel={() => setReinstallModal(null)}
              onConfirm={(id, url) => { executeInstall(id, url); setReinstallModal(null); }}
              playSfx={playSfx}
            />
          )}

          {teamModalVisible && <TeamModal onClose={() => setTeamModalVisible(false)} playSfx={playSfx} />}
          {mcNotif && <Notification title={mcNotif.t} message={mcNotif.m} />}
        </main>
      </div>
    </ThemeProvider>
  );
}