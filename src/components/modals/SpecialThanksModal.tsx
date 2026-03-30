import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function SpecialThanksModal({
  isOpen,
  onClose,
  playSfx,
}: any) {
  const [focusIndex, setFocusIndex] = useState(0);

  const contributors = [
    { name: "smartcmd & LCE Community", desc: "Research & Foundations" },
    { name: "Andi_pog & AFanFromWalmart", desc: "Project Testers" }
  ];

  useEffect(() => {
    if (!isOpen) {
      setFocusIndex(0);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        playSfx("close_click.wav");
        onClose();
      } else if (e.key === "ArrowDown" || e.key === "Tab") {
        e.preventDefault();
        setFocusIndex((prev) => (prev + 1) % (contributors.length + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((prev) => (prev - 1 + (contributors.length + 1)) % (contributors.length + 1));
      } else if (e.key === "Enter") {
        if (focusIndex === contributors.length) {
          playSfx("close_click.wav");
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, focusIndex]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm outline-none border-none"
    >
      <div
        className="relative w-[400px] p-6 flex flex-col items-center shadow-2xl"
        style={{
          backgroundImage: "url('/images/frame_background.png')",
          backgroundSize: "100% 100%",
          imageRendering: "pixelated",
        }}
      >
        <h2 className="text-[#FFFF55] text-2xl mc-text-shadow mb-4 border-b-2 border-[#373737] pb-2 w-full text-center uppercase">
          Special Thanks
        </h2>
        <div className="flex flex-col gap-2 w-full items-center max-h-[320px] overflow-y-auto overflow-x-hidden scrollbar-hide py-2">
          {contributors.map((item, idx) => (
            <div
              key={item.name}
              onMouseEnter={() => setFocusIndex(idx)}
              className={`w-[90%] p-2 flex flex-col items-center justify-center mc-text-shadow transition-transform outline-none border-none bg-transparent ${focusIndex === idx ? "scale-105 text-[#FFFF55]" : "opacity-80 text-white"}`}
            >
              <span className="text-xl">
                {item.name}
              </span>
              <span className="text-[10px] text-[#A0A0A0] uppercase tracking-widest mt-1">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
        <button
          onMouseEnter={() => setFocusIndex(contributors.length)}
          onClick={() => {
            playSfx("close_click.wav");
            onClose();
          }}
          className={`mt-6 w-56 h-12 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none ${focusIndex === contributors.length ? "text-[#FFFF55]" : "text-white"}`}
          style={{
            backgroundImage: focusIndex === contributors.length
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
