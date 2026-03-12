import React from 'react';
import { TauriService } from '../../services/tauri';
import { ReinstallModalData } from '../../types';

interface VersionsViewProps {
  installedStatus: Record<string, boolean>;
  installingInstance: string | null;
  executeInstall: (id: string, url: string) => void;
  setReinstallModal: (data: ReinstallModalData | null) => void;
  playSfx: (name: string, multiplier?: number) => void;
}

export const VersionsView: React.FC<VersionsViewProps> = ({
  installedStatus,
  installingInstance,
  executeInstall,
  setReinstallModal,
  playSfx,
}) => {
  const versions = [
    {
      id: "vanilla_tu19",
      name: "Vanilla Nightly (TU19)",
      desc: "Leaked 4J Studios build.",
      url: "https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu19_vanilla.zip"
    },
    {
      id: "vanilla_tu24",
      name: "Vanilla TU24",
      desc: "Horses and Wither update.",
      url: "https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu24_vanilla.zip"
    }
  ];

  return (
    <div className="w-full max-w-3xl bg-black/80 p-12 border-4 border-black h-full overflow-y-auto no-scrollbar animate-in fade-in">
      <h2 className="text-5xl mb-8 border-b-4 border-white/20 pb-4">Instances</h2>
      <div className="flex flex-col gap-6">
        {versions.map(v => (
          <div key={v.id} className="flex justify-between items-center bg-[#2a2a2a] border-4 border-black p-6">
            <div>
              <h3 className="text-2xl font-bold">{v.name}</h3>
              <p className="text-slate-400 text-sm">{v.desc}</p>
            </div>
            <div className="flex gap-2">
              {installedStatus[v.id] ? (
                <>
                  <button
                    onClick={() => {
                      playSfx('pop.wav');
                      TauriService.openInstanceFolder(v.id);
                    }}
                    className="legacy-btn px-4 py-2 text-xl"
                  >
                    Folder
                  </button>
                  <button
                    onClick={() => {
                      playSfx('click.wav');
                      setReinstallModal({ id: v.id, url: v.url });
                    }}
                    disabled={!!installingInstance}
                    className="legacy-btn px-4 py-2 text-xl reinstall-btn"
                  >
                    Reinstall
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    playSfx('click.wav');
                    executeInstall(v.id, v.url);
                  }}
                  disabled={!!installingInstance}
                  className="legacy-btn px-6 py-2 text-xl"
                >
                  INSTALL
                </button>
              )}
            </div>
          </div>
        ))}

        {['TU75', 'TU9', 'Modded Pack'].map(v => (
          <div key={v} className="flex justify-between items-center bg-[#1a1a1a] border-4 border-black p-6 opacity-50 grayscale">
            <div>
              <h3 className="text-2xl font-bold text-slate-500">Vanilla {v}</h3>
              <p className="text-slate-600 text-sm">Legacy version.</p>
            </div>
            <span className="text-[#ffff55] text-2xl font-bold italic">SOON</span>
          </div>
        ))}
      </div>
    </div>
  );
};
