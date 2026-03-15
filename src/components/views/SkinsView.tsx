import React, { useRef, useState } from "react";
import { SkinViewer } from "@/components/common/SkinViewer";
import { SkinLibraryItem } from "@/types";
import { Icons } from "@/components/Icons";

interface SkinsViewProps {
  skinBase64?: string;
  skinLibrary: SkinLibraryItem[];
  playSfx: (name: string, multiplier?: number) => void;
  onSelectSkin: (base64: string) => void;
  onAddSkin: (name: string, base64: string) => void;
  onRenameSkin: (id: string, newName: string) => void;
  onDeleteSkin: (id: string) => void;
  gamepadConnected: boolean;
}

export const SkinsView: React.FC<SkinsViewProps> = ({
  skinBase64,
  skinLibrary,
  playSfx,
  onSelectSkin,
  onAddSkin,
  onRenameSkin,
  onDeleteSkin,
  gamepadConnected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, "");
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const cvs = document.createElement("canvas");
        cvs.width = 64;
        cvs.height = 32;
        const ctx = cvs.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 64, 32, 0, 0, 64, 32);
          const base64 = cvs.toDataURL("image/png");
          onAddSkin(fileName, base64);
          playSfx("wood click.wav");
        }
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const startRename = (item: SkinLibraryItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    playSfx("click.wav");
  };

  const saveRename = () => {
    if (editingId && editName.trim()) {
      onRenameSkin(editingId, editName.trim());
      setEditingId(null);
      playSfx("pop.wav");
    }
  };

  return (
    <div className="w-full max-w-5xl bg-black/80 border-[var(--border-width)] border-[var(--border-primary)] h-full flex flex-col md:flex-row overflow-hidden animate-in fade-in rounded-[var(--radius-base)] backdrop-blur-[var(--backdrop-blur)]">
      <div className="w-full md:w-80 bg-black/40 border-b-[var(--border-width)] md:border-b-0 md:border-r-[var(--border-width)] border-[var(--border-primary)] p-8 flex flex-col items-center gap-6">
        <h2 className="text-3xl legacy-text-shadow self-start text-[#ffffff]">CURRENT SKIN</h2>
        <div className="w-48 h-72 bg-black/50 border-[var(--border-width)] border-[var(--border-primary)] shadow-[inset_calc(4px*var(--shadow-intensity))_calc(4px*var(--shadow-intensity))_#222] relative group rounded-[var(--radius-base)]">
          <SkinViewer skinUrl={skinBase64 || null} />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept="image/png"
          className="hidden"
        />

        <div className="w-full flex flex-col gap-2 mt-4">
          <button
            onClick={() => { playSfx("wood click.wav"); fileInputRef.current?.click(); }}
            className="legacy-btn w-full py-3 text-xl"
          >
            UPLOAD NEW SKIN
          </button>

          <button
            onClick={() => { playSfx("pop.wav"); onSelectSkin(""); }}
            style={{ 
              boxShadow: "inset calc(3px * var(--shadow-intensity)) calc(3px * var(--shadow-intensity)) #ff5555, inset calc(-3px * var(--shadow-intensity)) calc(-3px * var(--shadow-intensity)) #4a0000"
            } as React.CSSProperties}
            className="legacy-btn px-6 py-2 text-sm transition-colors self-center !text-white hover:!bg-[#aa0000]"
          >
            RESET SKIN
          </button>
        </div>

        <p className="text-sm text-slate-400 italic text-center">
          Upload a 64x64 or 64x32 PNG file. It will be added to your library.
        </p>
      </div>

      <div className="flex-1 p-8 flex flex-col gap-6 overflow-hidden">
        <h2 className="text-3xl legacy-text-shadow text-[#ffffff]">SKIN LIBRARY</h2>

        <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
          {skinLibrary.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 italic gap-4">
              <p className="text-2xl">Your library is empty</p>
              <p>Upload a skin to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {skinLibrary.map((item) => (
                <div
                  key={item.id}
                  className={`relative group bg-[#2a2a2a] border-[var(--border-width)] transition-all duration-150 rounded-[var(--radius-base)] overflow-hidden ${skinBase64 === item.skinBase64
                    ? "border-[var(--accent-primary)] shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    : "border-[var(--border-primary)] hover:border-[var(--border-secondary)] shadow-[inset_calc(4px*var(--shadow-intensity))_calc(4px*var(--shadow-intensity))_#444]"
                    }`}
                >
                  <div
                    className="h-48 cursor-pointer relative"
                    onClick={() => {
                      playSfx("wood click.wav");
                      onSelectSkin(item.skinBase64);
                    }}
                  >
                    <SkinViewer skinUrl={item.skinBase64} />
                    {skinBase64 === item.skinBase64 && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 legacy-text-shadow-none">
                        SELECTED
                      </div>
                    )}
                    {gamepadConnected && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded scale-75 opacity-0 group-hover:opacity-100 transition-opacity">
                        <img src="/images/ButtonA.png" className="w-4 h-4" alt="A" />
                        <span className="text-[10px] font-bold">SELECT</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-black/60 border-t-[var(--border-width)] border-[var(--border-primary)] flex items-center justify-between gap-2">
                    {editingId === item.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveRename()}
                          onBlur={saveRename}
                          className="flex-1 bg-black border-2 border-slate-700 text-sm px-2 py-1 outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="text-sm truncate legacy-text-shadow flex-1">
                          {item.name}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); startRename(item); }}
                            className="p-1 hover:text-emerald-400"
                            title="Rename"
                          >
                            <Icons.Edit />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); playSfx("pop.wav"); onDeleteSkin(item.id); }}
                            className="p-1 hover:text-red-500"
                            title="Delete"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
