import { useState, useEffect } from 'react';
import { listen } from "@tauri-apps/api/event";
import { TauriService } from '../services/tauri';
import { InstalledStatus, McNotification } from '../types';

export const useGameInstances = (
  playSfx: (name: string, multiplier?: number) => void,
  setMcNotif: (notif: McNotification | null) => void
) => {
  const [installingInstance, setInstallingInstance] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [installedStatus, setInstalledStatus] = useState<InstalledStatus>({
    vanilla_tu19: false,
    vanilla_tu24: false,
  });

  const updateAllStatus = async () => {
    const v19 = await TauriService.checkGameInstalled("vanilla_tu19");
    const v24 = await TauriService.checkGameInstalled("vanilla_tu24");
    setInstalledStatus({ vanilla_tu19: v19, vanilla_tu24: v24 });
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
