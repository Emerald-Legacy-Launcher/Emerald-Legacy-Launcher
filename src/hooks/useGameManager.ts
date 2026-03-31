import { useState, useEffect, useCallback, useMemo } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TauriService } from "../services/TauriService";

const appWindow = getCurrentWindow();

const BASE_EDITIONS = [
  {
    id: "revelations_edition",
    name: "Revelations",
    desc: "Enhanced LCE with uncapped FPS, graphics fixes, hardcore hearts, and dedicated server security. Features LAN multiplayer, split-screen, and keyboard & mouse support.",
    url: "https://github.com/itsRevela/MinecraftConsoles/releases/download/Nightly/LCREWindows64.zip",
    titleImage: "/images/minecraft_title_revelations.png",
    credits: {
      developer: "itsRevela",
      platform: "github",
      url: "https://github.com/itsRevela"
    }
  },
  {
    id: "360revived",
    name: "360 Revived",
    desc: "PC port of Xbox 360 Edition TU19 with desktop optimizations. Features keyboard & mouse, fullscreen, LAN multiplayer, dedicated server, and split-screen support.",
    url: "https://github.com/BluTac10/360Revived/releases/download/nightly/LCEWindows64.zip",
    titleImage: "/images/minecraft_title_360revived.png",
    credits: {
      developer: "BluTac10",
      platform: "github",
      url: "https://github.com/BluTac10"
    }
  },
  {
    id: "legacy_evolved",
    name: "Legacy Evolved",
    desc: "Backports newer title updates to LCE TU19 base. Currently porting TU25 (98% complete) and TU31 (76% complete).",
    url: "https://codeberg.org/piebot/LegacyEvolved/releases/download/nightly/LCEWindows64.zip",
    titleImage: "/images/minecraft_title_LegacyEvolved.png",
    credits: {
      developer: "piebot",
      platform: "codeberg",
      url: "https://codeberg.org/piebot"
    }
  },
  {
    id: "vanilla_tu19",
    name: "Title Update 19",
    desc: "Minecraft LCE v1.6.0560.0 with compilation fixes. Base version for modding with keyboard & mouse, fullscreen, LAN multiplayer, and dedicated server support.",
    url: "https://github.com/smartcmd/MinecraftConsoles/releases/download/nightly/LCEWindows64.zip",
    titleImage: "/images/minecraft_title_tu19.png",
    credits: {
      developer: "smartcmd",
      platform: "github",
      url: "https://github.com/smartcmd"
    }
  },
  {
    id: "lmrp_placeholder",
    name: "LMRP (Coming Soon)",
    desc: "Legacy Minecraft Restoration Project - Classic mini-games and nostalgic gameplay. Stay tuned for updates!",
    url: "",
    titleImage: "/images/minecraft_title_lmrp.png",
    credits: {
      developer: "LMRP Team",
      platform: "github",
      url: "https://github.com/LMRP-Project"
    }
  },
];

const PARTNERSHIP_SERVERS = [
  {
    name: "Kowhaifans Clubhouse",
    ip: "kowhaifan.ddns.net",
    port: 25565,
  },
];

interface GameManagerProps {
  profile: string;
  setProfile: (id: string) => void;
  customEditions: any[];
  setCustomEditions: (editions: any[]) => void;
  keepLauncherOpen: boolean;
}

export function useGameManager({ profile, setProfile, customEditions, setCustomEditions, keepLauncherOpen }: GameManagerProps) {
  const [installs, setInstalls] = useState<string[]>([]);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isRunnerDownloading, setIsRunnerDownloading] = useState(false);
  const [runnerDownloadProgress, setRunnerDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editions = useMemo(() => [...BASE_EDITIONS, ...customEditions], [customEditions]);

  const checkInstalls = useCallback(async () => {
    const results = await Promise.all(
      editions.map(async (e) => {
        const isInstalled = await TauriService.checkGameInstalled(e.id);
        return isInstalled ? e.id : null;
      }),
    );
    setInstalls(results.filter((id): id is string => id !== null));
  }, [editions]);

  useEffect(() => {
    checkInstalls();
    const unlistenDownload = TauriService.onDownloadProgress((p) => setDownloadProgress(p));
    const unlistenRunner = TauriService.onRunnerDownloadProgress((p) => setRunnerDownloadProgress(p));
    return () => {
      unlistenDownload.then((u) => u());
      unlistenRunner.then((u) => u());
    };
  }, [customEditions, checkInstalls]);

  const downloadRunner = useCallback(async (name: string, url: string) => {
    if (isRunnerDownloading) return;
    setIsRunnerDownloading(true);
    setRunnerDownloadProgress(0);
    setError(null);
    try {
      await TauriService.downloadRunner(name, url);
      setRunnerDownloadProgress(null);
    } catch (e: any) {
      console.error(e);
      setError(typeof e === 'string' ? e : e.message || "Failed to download runner");
    } finally {
      setIsRunnerDownloading(false);
    }
  }, [isRunnerDownloading]);

  const toggleInstall = useCallback(async (id: string) => {
    if (downloadingId) return;
    const edition = editions.find((e) => e.id === id);
    if (!edition) return;
    setError(null);
    try {
      setDownloadingId(id);
      setDownloadProgress(0);
      await TauriService.downloadAndInstall(edition.url, id);
      await TauriService.syncDlc(id);
      await checkInstalls();
      setProfile(id);
      setDownloadProgress(null);
      setDownloadingId(null);
    } catch (e: any) {
      console.error(e);
      setError(typeof e === 'string' ? e : e.message || "Failed to install version");
      setDownloadProgress(null);
      setDownloadingId(null);
    }
  }, [downloadingId, editions, checkInstalls, setProfile]);

  const handleUninstall = useCallback(async (id: string) => {
    await TauriService.deleteInstance(id);
    await checkInstalls();
  }, [checkInstalls]);

  const handleLaunch = useCallback(async () => {
    if (isGameRunning) return;
    setError(null);
    setIsGameRunning(true);
    try {
      if (!keepLauncherOpen) {
        await appWindow.hide();
      }
      await TauriService.launchGame(profile, PARTNERSHIP_SERVERS);
    } catch (e: any) {
      console.error(e);
      setError(typeof e === 'string' ? e : e.message || "Failed to launch game");
    } finally {
      setIsGameRunning(false);
      await appWindow.show();
      await appWindow.unminimize();
      await appWindow.setFocus();
    }
  }, [isGameRunning, profile, keepLauncherOpen]);

  const stopGame = useCallback(async () => {
    try {
      await TauriService.stopGame(profile);
      setIsGameRunning(false);
    } catch (e) {
      console.error(e);
    }
  }, [profile]);

  const addCustomEdition = useCallback((edition: { name: string; desc: string; url: string }) => {
    const id = `custom_${Date.now()}`;
    const newEdition = { ...edition, id, titleImage: "/images/minecraft_title_tucustom.png" };
    setCustomEditions([...customEditions, newEdition]);
    return id;
  }, [customEditions, setCustomEditions]);

  const deleteCustomEdition = useCallback((id: string) => {
    setCustomEditions(customEditions.filter((e) => e.id !== id));
    TauriService.deleteInstance(id).catch(console.error);
  }, [customEditions, setCustomEditions]);

  const updateCustomEdition = useCallback((id: string, updated: { name: string; desc: string; url: string }) => {
    setCustomEditions(customEditions.map((e) => e.id === id ? { ...e, ...updated } : e));
  }, [customEditions, setCustomEditions]);

  return {
    installs,
    isGameRunning,
    downloadProgress,
    downloadingId,
    isRunnerDownloading,
    runnerDownloadProgress,
    error,
    setError,
    editions,
    toggleInstall,
    handleUninstall,
    handleLaunch,
    stopGame,
    addCustomEdition,
    deleteCustomEdition,
    updateCustomEdition,
    downloadRunner,
    checkInstalls,
  };
}
