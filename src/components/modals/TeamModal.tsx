import { motion } from "framer-motion";
import { useState } from "react";

export default function TeamModal({
  isOpen,
  onClose,
  playClickSound,
  playSfx,
}: any) {
  if (!isOpen) return null;
  const [closeHover, setCloseHover] = useState(false);
  const team = [
    { name: "Leon", url: "https://github.com/hornyalcoholic" },
    { name: "Criador_Mods", url: "https://github.com/CriadorMods" },
    { name: "journ3ym3m", url: "https://github.com/journ3ym3n" },
    { name: "KayJann", url: "https://github.com/KayJannOnGit" },
    { name: "neoapps", url: "https://github.com/neoapps-dev" },
    { name: "Santiago Fisela", url: "https://github.com/PinkLittleKitty" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm outline-none border-none"
    >
      <div
        className="relative w-[360px] p-6 flex flex-col items-center shadow-2xl"
        style={{
          backgroundImage: "url('/images/frame_background.png')",
          backgroundSize: "100% 100%",
          imageRendering: "pixelated",
        }}
      >
        <h2 className="text-[#FFFF55] text-2xl mc-text-shadow mb-4 border-b-2 border-[#373737] pb-2 w-full text-center uppercase">
          Emerald Team
        </h2>
        <div className="flex flex-col gap-3 w-full items-center">
          {team.map((dev) => (
            <a
              key={dev.name}
              href={dev.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playClickSound()}
              className="w-56 h-10 flex items-center justify-center text-white hover:text-[#FFFF55] mc-text-shadow text-xl transition-all outline-none border-none bg-transparent"
              style={{
                backgroundImage: "url('/images/Button_Background.png')",
                backgroundSize: "100% 100%",
                imageRendering: "pixelated",
                color: "white",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundImage =
                  "url('/images/button_highlighted.png')")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundImage =
                  "url('/images/Button_Background.png')")
              }
            >
              {dev.name}
            </a>
          ))}
        </div>
        <button
          onMouseEnter={() => setCloseHover(true)}
          onMouseLeave={() => setCloseHover(false)}
          onClick={() => {
            playSfx("close_click.wav");
            onClose();
          }}
          className={`mt-6 w-56 h-12 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none hover:text-[#FFFF55] ${closeHover ? "text-[#FFFF55]" : "text-white"}`}
          style={{
            backgroundImage: closeHover
              ? "url('/images/button_highlighted.png')"
              : "url('/images/Button_Background.png')",
            backgroundSize: "100% 100%",
            imageRendering: "pixelated",
          }}
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}
