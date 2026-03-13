import React from 'react';
import { TauriService } from '../../services/tauri';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  playSfx: (name: string, multiplier?: number) => void;
  updateAllStatus: () => void;
  installingInstance: string | null;
  downloadProgress: number;
  showTeamModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  playSfx,
  updateAllStatus,
  installingInstance,
  downloadProgress,
  showTeamModal,
}) => {
  return (
    <aside className="w-64 min-w-[256px] flex-shrink-0 bg-[#2a2a2a] border-r-4 border-black p-6 flex flex-col gap-2 z-20 shadow-[inset_-4px_0_#555]">
      <div className="mb-10 px-2 flex items-center justify-center">
        <img src="/images/logo.png" alt="Logo" className="w-12 h-12" />
        <div className="ml-3">
            <h1 className="text-xl text-white leading-tight">Emerald<br/>Legacy<br/>Launcher</h1>
        </div>
      </div>
      <nav className="flex flex-col gap-3">
        <button
          onClick={() => {
            playSfx('click.wav');
            setActiveTab("home");
            updateAllStatus();
          }}
          className={`p-4 legacy-btn justify-start ${activeTab === "home" ? "active-tab" : ""}`}
        >
          HOME
        </button>
        <button
          onClick={() => {
            playSfx('click.wav');
            setActiveTab("versions");
            updateAllStatus();
          }}
          className={`p-4 legacy-btn justify-start ${activeTab === "versions" ? "active-tab" : ""}`}
        >
          VERSIONS
        </button>
        <button
          onClick={() => {
            playSfx('click.wav');
            setActiveTab("settings");
          }}
          className={`p-4 legacy-btn justify-start ${activeTab === "settings" ? "active-tab" : ""}`}
        >
          SETTINGS
        </button>
      </nav>

      {installingInstance && (
        <div className="sidebar-progress mt-auto">
          <div className="flex justify-between mb-3 text-slate-300 font-bold text-[10px] uppercase tracking-widest px-1">
            <span>Installing</span>
            <button
              onClick={() => {
                playSfx('back.ogg');
                TauriService.cancelDownload();
              }}
              className="text-red-500 hover:underline"
            >
              CANCEL
            </button>
          </div>
          <div className="mc-progress-container">
            <div
              className="mc-progress-bar transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
            <div className="mc-progress-text">{downloadProgress}%</div>
          </div>
        </div>
      )}

      <div
        onClick={() => {
          playSfx('click.wav');
          showTeamModal();
        }}
        className={`${installingInstance ? "pt-6" : "mt-auto pt-6"} flex flex-col items-center border-t-4 border-black/30 cursor-pointer group`}
      >
        <span className="text-slate-500 text-[10px] uppercase">Developed by</span>
        <span className="text-emerald-500 text-sm font-bold group-hover:underline">Emerald Team</span>
      </div>
    </aside>
  );
};
