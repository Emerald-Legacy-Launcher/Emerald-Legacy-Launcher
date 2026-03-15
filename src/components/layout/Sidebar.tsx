import React, { useState } from "react";
import { TauriService } from "../../services/tauri";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  playSfx: (name: string, multiplier?: number) => void;
  updateAllStatus: () => void;
  installingInstance: string | null;
  downloadProgress: number;
  showTeamModal: () => void;
  gamepadConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
    activeTab,
    setActiveTab,
    playSfx,
    updateAllStatus,
    installingInstance,
    downloadProgress,
    showTeamModal,
    gamepadConnected,
  } = props;

  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    playSfx("click.wav");
    setCollapsed(!collapsed);
  };

  const navItems = [
    { id: "home", label: "HOME" },
    { id: "versions", label: "VERSIONS" },
    { id: "skins", label: "SKINS" },
    { id: "settings", label: "SETTINGS" }
  ];

  return (
    <aside className={`flex-shrink-0 bg-[var(--bg-secondary)] flex flex-col relative z-50 transition-all duration-300 border-[var(--border-primary)] shadow-[inset_calc(-4px*var(--shadow-intensity))_0_var(--border-secondary)] backdrop-blur-[var(--backdrop-blur)] ${collapsed ? "w-0 border-r-0" : "w-64 border-r-[var(--border-width)]"}`}>

      <button
        onClick={toggleSidebar}
        className="absolute top-10 w-8 h-8 flex items-center justify-center cursor-pointer z-50 legacy-toggle rounded-full"
        style={{
          left: collapsed ? "0px" : "256px",
        }}
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div className={`flex flex-col h-full w-64 p-6 overflow-hidden transition-all duration-300 ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>

        <div className="mb-10 flex items-center justify-center">
          <div
            className="w-12 h-12 bg-contain bg-center bg-no-repeat drop-shadow-md"
            style={{ backgroundImage: "var(--logo-url)" }}
          />
          <div className="ml-3">
            <h1 className="text-xl text-white leading-tight legacy-text-shadow">
              Emerald<br />Legacy<br />Launcher
            </h1>
          </div>
        </div>

        {gamepadConnected && (
          <div className="flex justify-center mb-4 gap-4 animate-in fade-in zoom-in">
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded">
              <img src="/images/ButtonLeftBumper.png" className="gp-hint" alt="LB" />
              <span className="text-[10px] text-stone-400">PREV</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded">
              <img src="/images/ButtonRightBumper.png" className="gp-hint" alt="RB" />
              <span className="text-[10px] text-stone-400">NEXT</span>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                playSfx("click.wav");
                setActiveTab(item.id);
                if (item.id !== "settings") updateAllStatus();
              }}
              className={`h-14 flex items-center justify-center transition-all duration-150 legacy-btn ${activeTab === item.id
                  ? "scale-[1.02] brightness-110"
                  : "opacity-90 hover:opacity-100 hover:scale-[1.02] active:scale-95"
                }`}
            >
              <span className={`text-xl tracking-wider legacy-text-shadow mt-1 transition-opacity ${activeTab === item.id ? "text-[var(--btn-text)] opacity-100" : "text-[var(--btn-text)] opacity-60"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>


        {installingInstance && (
          <div className="mt-auto bg-black/40 p-4 border-[var(--border-width)] border-[var(--border-primary)] rounded-[var(--radius-base)]">
            <div className="flex justify-between mb-3 text-slate-300 text-[10px] uppercase tracking-widest px-1">
              <span>Installing</span>
              <button onClick={() => { playSfx("back.ogg"); TauriService.cancelDownload(); }} className="text-[#FF5555]">
                CANCEL
              </button>
            </div>
            <div className="mc-progress-container !h-4 !border-2">
              <div className="mc-progress-bar transition-all duration-300 !h-2" style={{ width: `${downloadProgress}%` }} />
              <div className="mc-progress-text !text-[10px] leading-tight mt-0.5">{downloadProgress}%</div>
            </div>
          </div>
        )}

        <div
          onClick={() => { playSfx("click.wav"); showTeamModal(); }}
          className={`${installingInstance ? "pt-6" : "mt-auto pt-6"} flex flex-col items-center border-t-[var(--border-width)] border-[var(--border-primary)] cursor-pointer group`}
        >
          <span className="text-stone-400 text-[10px] uppercase tracking-widest">Developed by</span>
          <span className="text-white text-sm font-bold group-hover:text-[#55FF55] transition-colors legacy-text-shadow mt-1">
            Emerald Team
          </span>
        </div>
      </div>
    </aside>
  );
};