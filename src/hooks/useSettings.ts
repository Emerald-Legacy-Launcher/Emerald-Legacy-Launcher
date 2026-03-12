import { useState, useEffect } from 'react';

export const useSettings = () => {
  const [musicVol, setMusicVol] = useState(parseFloat(localStorage.getItem("musicVol") || "0.4"));
  const [sfxVol, setSfxVol] = useState(parseFloat(localStorage.getItem("sfxVol") || "0.7"));
  const [isMuted, setIsMuted] = useState(localStorage.getItem("isMuted") === "true");

  useEffect(() => {
    localStorage.setItem("musicVol", musicVol.toString());
    localStorage.setItem("sfxVol", sfxVol.toString());
    localStorage.setItem("isMuted", isMuted.toString());
  }, [musicVol, sfxVol, isMuted]);

  return {
    musicVol,
    setMusicVol,
    sfxVol,
    setSfxVol,
    isMuted,
    setIsMuted,
  };
};
