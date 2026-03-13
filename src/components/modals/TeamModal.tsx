import React from 'react';
import { openUrl } from "@tauri-apps/plugin-opener";

interface TeamModalProps {
  onClose: () => void;
  playSfx: (name: string, multiplier?: number) => void;
}

const devs = [
  { name: "Criador_Mods", url: "https://github.com/CriadorMods" },
  { name: "Leon", url: "https://github.com/hornyalcoholic" },
  { name: "journ3ym3m", url: "https://github.com/journ3ym3n" },
  { name: "KayJann", url: "https://github.com/KayJannOnGit" },
  { name: "NeoApps", url: "https://github.com/neoapps-dev" },
  { name: "Santiago Fisela", url: "https://github.com/PinkLittleKitty" },
];

export const TeamModal: React.FC<TeamModalProps> = ({
  onClose,
  playSfx,
}) => {
  return (
    <div className="absolute inset-0 bg-black/80 z-[200] flex items-center justify-center animate-in fade-in">
      <div className="bg-[#2a2a2a] border-4 border-black p-8 w-[500px] shadow-[inset_4px_4px_#555,inset_-4px_-4px_#111]">
        <h3 className="text-4xl text-emerald-400 mb-6 font-bold uppercase tracking-widest text-center">
          Emerald Team
        </h3>
        
        <div className="flex flex-col gap-2 mb-8 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
          {devs.map((dev) => (
            <div 
              key={dev.name}
              onClick={() => {
                playSfx('click.wav');
                openUrl(dev.url);
              }}
              className="flex items-center justify-between p-3 bg-black/40 border-2 border-slate-700 hover:border-emerald-500 cursor-pointer transition-colors group"
            >
              <span className="text-xl text-white group-hover:text-emerald-400">{dev.name}</span>
              <span className="text-xs text-slate-500 uppercase">GitHub</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            playSfx('back.ogg');
            onClose();
          }}
          className="legacy-btn px-8 py-3 text-2xl w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};
