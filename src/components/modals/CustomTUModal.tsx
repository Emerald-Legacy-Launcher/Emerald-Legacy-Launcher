import { motion } from "framer-motion";
import { useState } from "react";

export default function CustomTUModal({
  isOpen,
  onClose,
  onImport,
  playSfx,
}: any) {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

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
          Import Custom TU
        </h2>

        <div className="flex flex-col gap-5 w-full">
          <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-sm mc-text-shadow uppercase tracking-widest ml-1">
              TU Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Awesome Mod"
              className="w-full h-12 px-4 bg-black/40 border-2 border-[#373737] text-white text-lg focus:border-[#FFFF55] transition-colors outline-none font-['Mojangles']"
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
              placeholder="A brief description..."
              className="w-full h-12 px-4 bg-black/40 border-2 border-[#373737] text-white text-lg focus:border-[#FFFF55] transition-colors outline-none font-['Mojangles']"
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
              placeholder="https://example.com/mod.zip"
              className="w-full h-12 px-4 bg-black/40 border-2 border-[#373737] text-white text-lg focus:border-[#FFFF55] transition-colors outline-none font-['Mojangles']"
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
            onClick={() => {
              playSfx("close_click.wav");
              onClose();
            }}
            className="flex-1 h-12 flex items-center justify-center text-white text-xl mc-text-shadow transition-all outline-none border-none bg-transparent hover:text-[#FFFF55]"
            style={{
              backgroundImage: "url('/images/Button_Background.png')",
              backgroundSize: "100% 100%",
              imageRendering: "pixelated",
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
            Cancel
          </button>
          <button
            onClick={() => {
              playSfx("save_click.wav");
              handleImport();
            }}
            className="flex-1 h-12 flex items-center justify-center text-white text-xl mc-text-shadow transition-all outline-none border-none bg-transparent hover:text-[#FFFF55]"
            style={{
              backgroundImage: "url('/images/Button_Background.png')",
              backgroundSize: "100% 100%",
              imageRendering: "pixelated",
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
            Import
          </button>
        </div>
      </div>
    </motion.div>
  );
}
