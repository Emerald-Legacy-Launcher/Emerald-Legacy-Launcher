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

import { GAME_VERSIONS } from '../../services/versions';

export const VersionsView: React.FC<VersionsViewProps> = ({
  installedStatus,
  installingInstance,
  executeInstall,
  setReinstallModal,
  playSfx,
}) => {
  return (
    <div className="w-full max-w-3xl bg-black/80 p-8 md:p-12 border-4 border-black h-full overflow-y-auto no-scrollbar animate-in fade-in">
      <h2 className="text-5xl mb-8 border-b-4 border-white/20 pb-4">Instances</h2>
      <div className="flex flex-col gap-6">
        {GAME_VERSIONS.map(v => (
          <div 
            key={v.id} 
            className={`flex justify-between items-center border-4 border-black p-6 ${
              v.isComingSoon 
                ? "bg-[#1a1a1a] opacity-50 grayscale" 
                : "bg-[#2a2a2a]"
            }`}
          >
            <div>
              <h3 className={`text-2xl font-bold ${v.isComingSoon ? "text-slate-500" : ""}`}>
                {v.name}
              </h3>
              <p className={`${v.isComingSoon ? "text-slate-600" : "text-slate-400"} text-sm`}>
                {v.desc}
              </p>
            </div>
            <div className="flex gap-2">
              {v.isComingSoon ? (
                <span className="text-[#ffff55] text-2xl font-bold italic">SOON</span>
              ) : installedStatus[v.id] ? (
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
      </div>
    </div>
  );
};
