import { useState, useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import { TauriService, ThemePalette } from "../../services/TauriService";
import { useUI, useConfig, useAudio } from "../../context/LauncherContext";

const ThemesView = memo(function ThemesView() {
  const { setActiveView } = useUI();
  const { theme: currentTheme, setTheme } = useConfig();
  const { playClickSound, playBackSound } = useAudio();

  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [externalPalettes, setExternalPalettes] = useState<ThemePalette[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const baseThemes = ["Default", "Modern"];

  useEffect(() => {
    TauriService.getExternalPalettes().then(setExternalPalettes);
  }, []);

  const totalPalettes = [...baseThemes, ...externalPalettes.map((p) => p.name)];
  const ITEM_COUNT = 3; // Theme Cycle, Import Theme, Back

  const handleImport = async () => {
    playClickSound();
    try {
      const result = await TauriService.importTheme();
      if (result === "success") {
        const updated = await TauriService.getExternalPalettes();
        setExternalPalettes(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace") {
        playBackSound();
        setActiveView("main");
        return;
      }

      if (e.key === "ArrowDown") {
        setFocusIndex((prev) =>
          prev === null || prev >= ITEM_COUNT - 1 ? 0 : prev + 1,
        );
      } else if (e.key === "ArrowUp") {
        setFocusIndex((prev) =>
          prev === null || prev <= 0 ? ITEM_COUNT - 1 : prev - 1,
        );
      } else if (e.key === "Enter" && focusIndex !== null) {
        if (focusIndex === 0) {
          playClickSound();
          const currentIndex = totalPalettes.indexOf(currentTheme);
          const nextIndex = (currentIndex + 1) % totalPalettes.length;
          setTheme(totalPalettes[nextIndex]);
        } else if (focusIndex === 1) {
          handleImport();
        } else {
          playBackSound();
          setActiveView("main");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    focusIndex,
    currentTheme,
    playClickSound,
    playBackSound,
    setActiveView,
    setTheme,
    totalPalettes,
  ]);

  useEffect(() => {
    if (focusIndex !== null) {
      const el = containerRef.current?.querySelector(
        `[data-index="${focusIndex}"]`,
      ) as HTMLElement;
      if (el) el.focus();
    }
  }, [focusIndex]);

  const getItemStyle = (index: number) => ({
    backgroundImage:
      focusIndex === index
        ? "url('/images/button_highlighted.png')"
        : "url('/images/Button_Background.png')",
    backgroundSize: "100% 100%",
    imageRendering: "pixelated" as const,
  });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: useConfig().animationsEnabled ? 0.3 : 0 }}
      className="flex flex-col items-center w-full max-w-2xl outline-none"
    >
      <h2 className="text-2xl text-white mc-text-shadow mt-2 mb-4 border-b-2 border-[#373737] pb-2 w-[60%] max-w-[300px] text-center tracking-widest uppercase opacity-80">
        Themes & Styles
      </h2>

      <div className="w-full max-w-[540px] flex flex-col items-center gap-4 mt-4 mb-8">
        <button
          data-index="0"
          onMouseEnter={() => setFocusIndex(0)}
          onClick={() => {
            playClickSound();
            const currentIndex = totalPalettes.indexOf(currentTheme);
            const nextIndex = (currentIndex + 1) % totalPalettes.length;
            setTheme(totalPalettes[nextIndex]);
          }}
          className={`w-72 h-12 flex items-center justify-center px-4 relative transition-colors outline-none border-none hover:text-[#FFFF55] ${focusIndex === 0 ? "text-[#FFFF55]" : "text-white"}`}
          style={getItemStyle(0)}
        >
          <span className="text-2xl mc-text-shadow tracking-widest uppercase">
            {currentTheme}
          </span>
        </button>

        <button
          data-index="1"
          onMouseEnter={() => setFocusIndex(1)}
          onClick={handleImport}
          className={`w-72 h-12 flex items-center justify-center px-4 relative transition-colors outline-none border-none hover:text-[#FFFF55] ${focusIndex === 1 ? "text-[#FFFF55]" : "text-white"}`}
          style={getItemStyle(1)}
        >
          <span className="text-xl mc-text-shadow tracking-widest uppercase">
            Import Theme
          </span>
        </button>
      </div>

      <button
        data-index="2"
        onMouseEnter={() => setFocusIndex(2)}
        onClick={() => {
          playBackSound();
          setActiveView("main");
        }}
        className={`w-72 h-12 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none hover:text-[#FFFF55] ${focusIndex === 2 ? "text-[#FFFF55]" : "text-white"}`}
        style={getItemStyle(2)}
      >
        Back
      </button>
    </motion.div>
  );
});

export default ThemesView;
