import { useState } from "react";

// Services
import { TauriService } from "@/services/tauri";
import { PARTNER_SERVERS } from "@/services/versions";

export const useLauncher = (
  selectedInstance: string,
  musicRef: React.RefObject<HTMLAudioElement | null>,
  isMuted: boolean,
  musicVol: number,
  playRandomMusic: () => void,
  playSfx: (name: string, multiplier?: number) => void
) => {
  const [isRunning, setIsRunning] = useState(false);

  const fadeAndLaunch = async () => {
    playSfx("levelup.ogg", 0.4);
    setIsRunning(true);
    if (musicRef.current && !isMuted) {
      const startVol = musicRef.current.volume;
      const steps = 20;
      let currentStep = 0;
      const fade = setInterval(() => {
        currentStep++;
        if (musicRef.current) {
          musicRef.current.volume = Math.max(0, startVol * (1 - currentStep / steps));
        }
        if (currentStep >= steps) {
          clearInterval(fade);
          if (musicRef.current) musicRef.current.pause();
        }
      }, 50);
    }
    setTimeout(async () => {
      try {
        await TauriService.launchGame(selectedInstance, PARTNER_SERVERS);
      } catch (e) {
        alert(`Failed to launch game: ${e}`);
      } finally {
        setIsRunning(false);
        if (musicRef.current) {
          musicRef.current.volume = isMuted ? 0 : musicVol;
          playRandomMusic();
        }
      }
    }, 1500);
  };

  return {
    isRunning,
    fadeAndLaunch,
  };
};
