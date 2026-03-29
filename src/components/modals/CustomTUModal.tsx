import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function CustomTUModal({
  isOpen,
  onClose,
  onImport,
  playSfx,
  editingEdition = null,
}: any) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    if (isOpen && editingEdition) {
      setName(editingEdition.name);
      setDesc(editingEdition.desc);
      setUrl(editingEdition.url);
    } else if (!isOpen) {
      setName("");
      setDesc("");
      setUrl("");
      setError("");
    }
  }, [editingEdition, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFocusIndex(0);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        playSfx("close_click.wav");
        onClose();
      } else if (e.key === "Enter") {
        if (focusIndex === 3) {
          playSfx("close_click.wav");
          onClose();
        } else if (focusIndex === 4 || e.ctrlKey) {
          playSfx("save_click.wav");
          handleImport();
        }
      } else if (e.key === "ArrowDown" || e.key === "Tab") {
        e.preventDefault();
        setFocusIndex((prev) => (prev + 1) % 5);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((prev) => (prev - 1 + 5) % 5);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, focusIndex, name, desc, url]);

  if (!isOpen) return null;

  const handleImport = () => {
    if (!name || !url) {
      setError("Name and URL are required");
      return;
    }
    if (!url.startsWith("http")) {
      setError("Invalid URL");
      return;
    }
    setError("");
    onImport({ name, desc: desc || "Custom imported TU", url });
    onClose();
    setName("");
    setDesc("");
    setUrl("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex items-center justify-center backdrop-blur-sm outline-none border-none"
    >
      <div
        className="relative w-[450px] p-8 flex flex-col items-center shadow-2xl"
        style={{
          backgroundImage: "url('/images/frame_background.png')",
          backgroundSize: "100% 100%",
          imageRendering: "pixelated",
        }}
      >
        <h2 className="text-[#FFFF55] text-2xl mc-text-shadow mb-6 border-b-2 border-[#373737] pb-2 w-full text-center uppercase font-bold tracking-widest">
          {editingEdition ? "Edit Custom TU" : "Import Custom TU"}
        </h2>

        <div className="flex flex-col gap-5 w-full">
          <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-sm mc-text-shadow uppercase tracking-widest ml-1">
              TU Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusIndex(0)}
              placeholder="e.g. My Awesome Mod"
              className={`w-full h-12 px-4 bg-black/40 border-2 text-white text-lg transition-colors outline-none font-['Mojangles'] ${focusIndex === 0 ? "border-[#FFFF55]" : "border-[#373737]"}`}
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-sm mc-text-shadow uppercase tracking-widest ml-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onFocus={() => setFocusIndex(1)}
              placeholder="A brief description..."
              className={`w-full h-12 px-4 bg-black/40 border-2 text-white text-lg transition-colors outline-none font-['Mojangles'] ${focusIndex === 1 ? "border-[#FFFF55]" : "border-[#373737]"}`}
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-sm mc-text-shadow uppercase tracking-widest ml-1">
              Download URL (.zip)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setFocusIndex(2)}
              placeholder="https://example.com/mod.zip"
              className={`w-full h-12 px-4 bg-black/40 border-2 text-white text-lg transition-colors outline-none font-['Mojangles'] ${focusIndex === 2 ? "border-[#FFFF55]" : "border-[#373737]"}`}
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          {error && (
            <div className="text-red-500 text-center mc-text-shadow uppercase text-xs tracking-widest mt-1">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-8 w-full">
          <button
            onMouseEnter={() => setFocusIndex(3)}
            onClick={() => {
              playSfx("close_click.wav");
              onClose();
            }}
            className={`flex-1 h-12 flex items-center justify-center text-xl mc-text-shadow transition-all outline-none border-none bg-transparent ${focusIndex === 3 ? "text-[#FFFF55]" : "text-white"}`}
            style={{
              backgroundImage: focusIndex === 3 ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')",
              backgroundSize: "100% 100%",
              imageRendering: "pixelated",
            }}
          >
            Cancel
          </button>
          <button
            onMouseEnter={() => setFocusIndex(4)}
            onClick={() => {
              playSfx("save_click.wav");
              handleImport();
            }}
            className={`flex-1 h-12 flex items-center justify-center text-xl mc-text-shadow transition-all outline-none border-none bg-transparent ${focusIndex === 4 ? "text-[#FFFF55]" : "text-white"}`}
            style={{
              backgroundImage: focusIndex === 4 ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')",
              backgroundSize: "100% 100%",
              imageRendering: "pixelated",
            }}
          >
            {editingEdition ? "Save" : "Import"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
