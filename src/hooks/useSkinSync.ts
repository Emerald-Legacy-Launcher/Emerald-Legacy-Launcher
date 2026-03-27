import { useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export function useSkinSync() {
  const [skinUrl, setSkinUrl] = useLocalStorage("lce-skin", "/images/Default.png");
  const [skinBase64, setSkinBase64] = useState<string | null>(null);

  useEffect(() => {
    const syncSkin = async () => {
      if (!skinUrl) return;
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const cvs = document.createElement("canvas");
          cvs.width = 64;
          cvs.height = 32;
          const ctx = cvs.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, 64, 32, 0, 0, 64, 32);
            setSkinBase64(cvs.toDataURL("image/png"));
          }
        };
        img.src = skinUrl;
      } catch (e) {
        console.error("Skin conversion failed:", e);
      }
    };
    syncSkin();
  }, [skinUrl]);

  return {
    skinUrl,
    setSkinUrl,
    skinBase64,
  };
}
