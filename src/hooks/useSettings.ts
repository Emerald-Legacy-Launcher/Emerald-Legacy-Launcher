import { useState, useEffect } from "react";

export const useSettings = () => {
  const [musicVol, setMusicVol] = useState(parseFloat(localStorage.getItem("musicVol") || "0.4"));
  const [sfxVol, setSfxVol] = useState(parseFloat(localStorage.getItem("sfxVol") || "0.7"));
  const [isMuted, setIsMuted] = useState(localStorage.getItem("isMuted") === "true");
  const [showClickParticles, setShowClickParticles] = useState(localStorage.getItem("showClickParticles") !== "false");
  const [showPanorama, setShowPanorama] = useState(localStorage.getItem("showPanorama") !== "false");
  const [themeId, setThemeId] = useState(localStorage.getItem("themeId") || "emerald");

  useEffect(() => {
    localStorage.setItem("musicVol", musicVol.toString());
    localStorage.setItem("sfxVol", sfxVol.toString());
    localStorage.setItem("isMuted", isMuted.toString());
    localStorage.setItem("showClickParticles", showClickParticles.toString());
    localStorage.setItem("showPanorama", showPanorama.toString());
    localStorage.setItem("themeId", themeId);
  }, [musicVol, sfxVol, isMuted, showClickParticles, showPanorama, themeId]);

  return {
    musicVol,
    setMusicVol,
    sfxVol,
    setSfxVol,
    isMuted,
    setIsMuted,
    showClickParticles,
    setShowClickParticles,
    showPanorama,
    setShowPanorama,
    themeId,
    setThemeId,
  };
};
