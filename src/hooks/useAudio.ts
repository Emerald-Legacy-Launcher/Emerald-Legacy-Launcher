import { useRef, useEffect } from 'react';
import { playSfx as playSfxService, ensureAudio } from '../services/audio';

export const useAudio = (musicVol: number, sfxVol: number, isMuted: boolean) => {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const lastTrack = useRef<number>(0);

  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = isMuted ? 0 : musicVol;
    }
  }, [musicVol, isMuted]);

  const playRandomMusic = () => {
    if (!musicRef.current) return;
    let track = Math.floor(Math.random() * 5) + 1;
    if (track === lastTrack.current) track = (track % 5) + 1;
    lastTrack.current = track;
    musicRef.current.src = `/music/music${track}.ogg`;
    musicRef.current.volume = isMuted ? 0 : musicVol;
    musicRef.current.play().catch(() => {});
  };

  const playSfx = (name: string, multiplier: number = 1.0) => {
    playSfxService(name, sfxVol, isMuted, multiplier);
  };

  return {
    musicRef,
    playRandomMusic,
    playSfx,
    ensureAudio,
  };
};
