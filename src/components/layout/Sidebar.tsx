import React, { useState } from 'react';
import { TauriService } from '../../services/tauri';

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
    playSfx('click.wav');
    setCollapsed(!collapsed);
  };

  const navItems = [
    { id: 'home', label: 'HOME' },
    { id: 'versions', label: 'VERSIONS' },
    { id: 'settings', label: 'SETTINGS' }
  ];

  return (
    <aside className={`flex-shrink-0 bg-[#2a2a2a] flex flex-col relative z-50 transition-all duration-300 border-black shadow-[inset_-4px_0_#555] ${collapsed ? 'w-0 border-r-0' : 'w-64 border-r-4'}`}>
      
      <button 
        onClick={toggleSidebar}
        className="absolute top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300 z-50 hover:brightness-125 active:scale-90"
        style={{ left: collapsed ? '8px' : '200px' }}
      >
        <img 
          src={`/images/Settings_Arrow_${collapsed ? 'Right' : 'Left'}.png`} 
          className="w-10 h-10 object-contain drop-shadow-lg"
          alt="toggle"
        />
      </button>

      <div className={`flex flex-col h-full w-64 p-6 overflow-hidden transition-all duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        <div className="mb-10 flex items-center justify-center">
          <img src="/images/logo.png" className="w-12 h-12 drop-shadow-md" alt="Logo" />
          <div className="ml-3">
              <h1 className="text-xl text-white leading-tight legacy-text-shadow">
                Emerald<br/>Legacy<br/>Launcher
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
                playSfx('click.wav');
                setActiveTab(item.id);
                if (item.id !== 'settings') updateAllStatus();
              }}
              className={`h-14 flex items-center justify-center transition-all duration-150 bg-[length:100%_100%] bg-no-repeat ${
                activeTab === item.id 
                  ? "bg-[url('/images/button_highlighted.png')] scale-[1.02] brightness-110" 
                  : "bg-[url('/images/button.png')] opacity-90 hover:opacity-100 hover:scale-[1.02] active:scale-95"
              }`}
            >
              <span className={`text-xl tracking-wider legacy-text-shadow mt-1 ${activeTab === item.id ? 'text-white' : 'text-[#d0d0d0]'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {installingInstance && (
          <div className="mt-auto bg-black/40 p-4 border-2 border-black">
            <div className="flex justify-between mb-3 text-slate-300 text-[10px] uppercase tracking-widest px-1">
              <span>Installing</span>
              <button onClick={() => { playSfx('back.ogg'); TauriService.cancelDownload(); }} className="text-[#FF5555]">
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
          onClick={() => { playSfx('click.wav'); showTeamModal(); }}
          className={`${installingInstance ? "pt-6" : "mt-auto pt-6"} flex flex-col items-center border-t-4 border-black/30 cursor-pointer group`}
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