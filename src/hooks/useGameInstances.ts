import { useState, useEffect } from 'react';
import { listen } from "@tauri-apps/api/event";
import { TauriService } from '../services/tauri';
import { InstalledStatus, McNotification } from '../types';
import { GAME_VERSIONS } from '../services/versions';

export const useGameInstances = (
  playSfx: (name: string, multiplier?: number) => void,
  setMcNotif: (notif: McNotification | null) => void
) => {
  const [installingInstance, setInstallingInstance] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [installedStatus, setInstalledStatus] = useState<InstalledStatus>(() => {
    const initial: InstalledStatus = {};
    GAME_VERSIONS.forEach(v => initial[v.id] = false);
    return initial;
  });

  const updateAllStatus = async () => {
    const newStatus: InstalledStatus = {};
    const availableVersions = GAME_VERSIONS.filter(v => !v.isComingSoon);
    await Promise.all(availableVersions.map(async (v) => {
      newStatus[v.id] = await TauriService.checkGameInstalled(v.id);
    }));
    setInstalledStatus(newStatus);
  };

  const executeInstall = async (id: string, url: string) => {
    setInstallingInstance(id);
    setDownloadProgress(0);
    try {
      await TauriService.downloadAndInstall(url, id);
      setMcNotif({ t: "Success!", m: "Ready to play." });
      playSfx('orb.ogg');
      setTimeout(() => setMcNotif(null), 4000);
      updateAllStatus();
    } catch (e) {
      console.error(e);
      alert("Error during installation: " + e);
    }
    setInstallingInstance(null);
  };

  useEffect(() => {
    updateAllStatus();
    const unlisten = listen<number>("download-progress", (e) =>
      setDownloadProgress(Math.round(e.payload))
    );
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return {
    installedStatus,
    installingInstance,
    downloadProgress,
    executeInstall,
    updateAllStatus,
  };
};
