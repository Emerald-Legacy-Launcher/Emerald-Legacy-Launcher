import { useState, useEffect, useRef, useCallback } from "react";

const TRACKS = [
  "/music/Blind Spots.ogg",
  "/music/Key.ogg",
  "/music/Living Mice.ogg",
  "/music/Oxygene.ogg",
  "/music/Subwoofer Lullaby.ogg",
];

const SPLASHES = [
  "Legacy is back!", "Pixelated goodness!", "Console Edition vibe!", "100% Not Microsoft!",
  "Symmetry is key!", "Does anyone even read these?", "Task failed successfully.",
  "Hardware accelerated!", "It's a feature, not a bug.", "Look behind you.",
  "Works on my machine.", "Now gluten-free!", "Mom, get the camera!", "Batteries not included.",
  "May contain nuts.", "Press Alt+F4 for diamonds!", "Downloading more RAM...",
  "Reinventing the wheel!", "The cake is a lie.", "Powered by copious amounts of coffee.",
  "I'm running out of ideas.", "That's no moon...", "Now with 100% more nostalgia!",
  "Legacy is the new modern.", "No microtransactions!", "As seen on TV!", "Ironic, isn't it?",
  "Creeper? Aww man.", "Technoblade never dies!",
];

interface AudioControllerProps {
  musicVol: number;
  sfxVol: number;
  showIntro: boolean;
  isGameRunning: boolean;
  isWindowVisible: boolean;
}

export function useAudioController({ musicVol, sfxVol, showIntro, isGameRunning, isWindowVisible }: AudioControllerProps) {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [splashIndex, setSplashIndex] = useState(-1);
  const musicPausedRef = useRef<{ at: number; track: number } | null>(null);

  const playSfx = useCallback((file: string) => {
    const a = new Audio(`/sounds/${file}`);
    a.volume = sfxVol / 100;
    a.play().catch(() => {});
  }, [sfxVol]);

  const playClickSound = useCallback(() => playSfx("click.wav"), [playSfx]);
  const playBackSound = useCallback(() => playSfx("back.ogg"), [playSfx]);
  const playSplashSound = useCallback(() => playSfx("orb.ogg"), [playSfx]);

  const cycleSplash = useCallback(() => {
    playSplashSound();
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * SPLASHES.length);
    } while (newIndex === splashIndex && SPLASHES.length > 1);
    setSplashIndex(newIndex);
  }, [playSplashSound, splashIndex]);

  useEffect(() => {
    if (showIntro || audioElement) return;
    const audio = new Audio(TRACKS[currentTrack]);
    audio.volume = musicVol / 100;
    const handleEnded = () => setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
    audio.addEventListener("ended", handleEnded);
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        document.addEventListener("click", () => audio.play(), { once: true });
      });
    }
    
    setAudioElement(audio);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, [showIntro]);

  useEffect(() => {
    if (!audioElement) return;
    audioElement.src = TRACKS[currentTrack];
    audioElement.play().catch(() => {});
  }, [currentTrack]);

  useEffect(() => {
    if (!audioElement) return;
    const shouldPause = isGameRunning || !isWindowVisible;

    if (shouldPause) {
      if (!audioElement.paused) {
        musicPausedRef.current = {
          at: audioElement.currentTime,
          track: currentTrack,
        };
        audioElement.pause();
      }
    } else if (musicPausedRef.current) {
      const { at, track } = musicPausedRef.current;
      musicPausedRef.current = null;
      if (track === currentTrack) {
        audioElement.currentTime = at;
      }
      audioElement.play().catch(() => {});
    }
  }, [isGameRunning, isWindowVisible]);

  useEffect(() => {
    if (audioElement) {
      audioElement.volume = musicVol / 100;
    }
  }, [musicVol, audioElement]);

  return {
    currentTrack,
    setCurrentTrack,
    splashIndex,
    setSplashIndex,
    cycleSplash,
    playClickSound,
    playBackSound,
    playSfx,
    tracks: TRACKS,
    splashes: SPLASHES,
  };
}
