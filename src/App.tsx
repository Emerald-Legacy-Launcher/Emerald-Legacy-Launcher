import { useState, useEffect } from "react";
import { useAudio } from "./hooks/useAudio";
import { useSettings } from "./hooks/useSettings";
import { useGameInstances } from "./hooks/useGameInstances";
import { useLauncher } from "./hooks/useLauncher";
import { TauriService } from "./services/tauri";
import { AppConfig, Runner, ReinstallModalData, McNotification } from "./types";
import { Sidebar } from "./components/layout/Sidebar";
import { HomeView } from "./components/views/HomeView";
import { VersionsView } from "./components/views/VersionsView";
import { SettingsView } from "./components/views/SettingsView";
import { FirstRunView } from "./components/views/FirstRunView";
import { ReinstallModal } from "./components/modals/ReinstallModal";
import { Notification } from "./components/common/Notification";
import "./index.css";

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

  const { musicVol, setMusicVol, sfxVol, setSfxVol, isMuted, setIsMuted } = useSettings();
  const { musicRef, playRandomMusic, playSfx, ensureAudio } = useAudio(musicVol, sfxVol, isMuted);
  const { installedStatus, installingInstance, downloadProgress, executeInstall, updateAllStatus } = useGameInstances(playSfx, setMcNotif);
  const { isRunning, fadeAndLaunch } = useLauncher(selectedInstance, musicRef, isMuted, musicVol, playRandomMusic, playSfx);

  useEffect(() => {
    TauriService.loadConfig().then((c) => {
      const config = c as AppConfig;
      if (config.username && config.username.trim() !== "") {
        setUsername(config.username);
        setIsFirstRun(false);
        setTimeout(playRandomMusic, 1000);
      }
      if (config.linuxRunner) setSelectedRunner(config.linuxRunner);
    });

    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes("linux")) {
      setIsLinux(true);
      TauriService.getAvailableRunners().then((runners) => {
        setAvailableRunners(runners);
      });
    }
  }, []);

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
    <div
      className="h-screen flex select-none overflow-hidden bg-black text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      <audio ref={musicRef} onEnded={playRandomMusic} />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        playSfx={playSfx}
        updateAllStatus={updateAllStatus}
        installingInstance={installingInstance}
        downloadProgress={downloadProgress}
      />

      <main className="flex-1 relative h-full">
        <div className="h-full flex flex-col items-center justify-center p-12 relative z-10">
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
              playSfx={playSfx}
            />
          )}
        </div>

        {reinstallModal && (
          <ReinstallModal
            data={reinstallModal}
            onCancel={() => setReinstallModal(null)}
            onConfirm={(id, url) => {
              executeInstall(id, url);
              setReinstallModal(null);
            }}
            playSfx={playSfx}
          />
        )}

        {mcNotif && (
          <Notification title={mcNotif.t} message={mcNotif.m} />
        )}
      </main>
    </div>
  );
}