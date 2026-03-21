import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppConfig } from "../hooks/useAppConfig";
import { useAudioController } from "../hooks/useAudioController";
import { useGameManager } from "../hooks/useGameManager";
import { useSkinSync } from "../hooks/useSkinSync";
import { useDiscordRPC } from "../hooks/useDiscordRPC";
import { useGamepad } from "../hooks/useGamepad";

interface UIContextType {
  activeView: string;
  setActiveView: (view: string) => void;
  showIntro: boolean;
  setShowIntro: (show: boolean) => void;
  logoAnimDone: boolean;
  setLogoAnimDone: (done: boolean) => void;
  isUiHidden: boolean;
  setIsUiHidden: (hidden: boolean) => void;
  isWindowVisible: boolean;
  showCredits: boolean;
  setShowCredits: (show: boolean) => void;
  focusSection: "menu" | "skin";
  setFocusSection: (section: "menu" | "skin") => void;
  onNavigateToSkin: () => void;
  onNavigateToMenu: () => void;
  connected: boolean;
}
const UIContext = createContext<UIContextType | undefined>(undefined);

export const ConfigContext = createContext<ReturnType<typeof useAppConfig> | undefined>(undefined);
export const AudioContext = createContext<ReturnType<typeof useAudioController> | undefined>(undefined);
export const GameContext = createContext<ReturnType<typeof useGameManager> | undefined>(undefined);
export const SkinContext = createContext<ReturnType<typeof useSkinSync> | undefined>(undefined);

export function LauncherProvider({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const [logoAnimDone, setLogoAnimDone] = useState(false);
  const [activeView, setActiveView] = useState("main");
  const [isUiHidden, setIsUiHidden] = useState(false);
  const [isWindowVisible, setIsWindowVisible] = useState(true);
  const [showCredits, setShowCredits] = useState(false);
  const [focusSection, setFocusSection] = useState<"menu" | "skin">("menu");

  const configRaw = useAppConfig();
  const skinSync = useSkinSync();
  const gameRaw = useGameManager({
    profile: configRaw.profile,
    setProfile: configRaw.setProfile,
    customEditions: configRaw.customEditions,
    setCustomEditions: configRaw.setCustomEditions,
  });
  const audioRaw = useAudioController({
    musicVol: configRaw.musicVol,
    sfxVol: configRaw.sfxVol,
    showIntro,
    isGameRunning: gameRaw.isGameRunning,
    isWindowVisible,
  });

  const config = useMemo(() => configRaw, [
    configRaw.username, configRaw.theme, configRaw.layout, configRaw.vfxEnabled,
    configRaw.rpcEnabled, configRaw.musicVol, configRaw.sfxVol, configRaw.isDayTime,
    configRaw.profile, configRaw.linuxRunner, configRaw.perfBoost, configRaw.customEditions,
    configRaw.legacyMode
  ]);

  const game = useMemo(() => gameRaw, [
    gameRaw.installs, gameRaw.isGameRunning, gameRaw.downloadProgress,
    gameRaw.downloadingId, gameRaw.editions, gameRaw.isRunnerDownloading,
    gameRaw.runnerDownloadProgress, gameRaw.error
  ]);

  const audio = useMemo(() => audioRaw, [
    audioRaw.currentTrack, audioRaw.splashIndex, audioRaw.tracks, audioRaw.splashes
  ]);

  useDiscordRPC({
    rpcEnabled: config.rpcEnabled,
    showIntro,
    username: config.username,
    profile: config.profile,
    activeView,
    isGameRunning: game.isGameRunning,
    downloadProgress: game.downloadProgress,
    downloadingId: game.downloadingId,
    editions: game.editions,
    isWindowVisible,
  });

  const { connected } = useGamepad({ playSfx: audio.playSfx, isWindowVisible });

  const onNavigateToSkin = useCallback(() => setFocusSection("skin"), []);
  const onNavigateToMenu = useCallback(() => setFocusSection("menu"), []);

  useEffect(() => {
    if (activeView === "main") {
      audioRaw.setSplashIndex(-1);
    }
  }, [activeView]);

  useEffect(() => {
    if (config.isLoaded) {
      config.saveConfig(skinSync.skinBase64);
    }
  }, [config.username, skinSync.skinBase64, config.theme, config.linuxRunner, config.perfBoost, config.customEditions, config.profile, config.isLoaded]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    
    (async () => {
      const appWindow = getCurrentWindow();
      const removeListener = await appWindow.listen<boolean>('tauri://visibility-change', ({ payload }) => {
        setIsWindowVisible(payload);
      });
      unlisten = removeListener;
    })();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const uiValue = useMemo(() => ({
    activeView, setActiveView, showIntro, setShowIntro,
    logoAnimDone, setLogoAnimDone, isUiHidden, setIsUiHidden,
    isWindowVisible,
    showCredits, setShowCredits, focusSection, setFocusSection,
    onNavigateToSkin, onNavigateToMenu, connected
  }), [activeView, showIntro, logoAnimDone, isUiHidden, isWindowVisible, showCredits, focusSection, onNavigateToSkin, onNavigateToMenu, connected]);

  return (
    <UIContext.Provider value={uiValue}>
      <ConfigContext.Provider value={config}>
        <AudioContext.Provider value={audio}>
          <GameContext.Provider value={game}>
            <SkinContext.Provider value={skinSync}>
              {children}
            </SkinContext.Provider>
          </GameContext.Provider>
        </AudioContext.Provider>
      </ConfigContext.Provider>
    </UIContext.Provider>
  );
}

export const useUI = () => { const c = useContext(UIContext); if (!c) throw new Error("useUI must be used within LauncherProvider"); return c; };
export const useConfig = () => { const c = useContext(ConfigContext); if (!c) throw new Error("useConfig must be used within LauncherProvider"); return c; };
export const useAudio = () => { const c = useContext(AudioContext); if (!c) throw new Error("useAudio must be used within LauncherProvider"); return c; };
export const useGame = () => { const c = useContext(GameContext); if (!c) throw new Error("useGame must be used within LauncherProvider"); return c; };
export const useSkin = () => { const c = useContext(SkinContext); if (!c) throw new Error("useSkin must be used within LauncherProvider"); return c; };
