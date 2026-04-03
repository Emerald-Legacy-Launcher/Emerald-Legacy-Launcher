import { useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

interface Edition {
  id: string;
  supportsSlimSkins?: boolean;
}

interface UseSkinSyncProps {
  profile: string;
  editions: Edition[];
}

export function useSkinSync({ profile, editions }: UseSkinSyncProps) {
  const [skinUrl, setSkinUrl] = useLocalStorage("lce-skin", "/images/Default.png");
  const [skinBase64, setSkinBase64] = useState<string | null>(null);

  useEffect(() => {
    const syncSkin = async () => {
      if (!skinUrl) return;
      const edition = editions.find((e) => e.id === profile);
      const supportsSlim = edition?.supportsSlimSkins ?? false;
      if (!supportsSlim) {
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
      } else {
        setSkinBase64(null);
      }
    };
    syncSkin();
  }, [skinUrl, profile, editions]);

  return {
    skinUrl,
    setSkinUrl,
    skinBase64,
  };
}
