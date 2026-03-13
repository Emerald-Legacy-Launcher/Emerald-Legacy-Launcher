import React from 'react';

interface HomeViewProps {
  username: string;
  selectedInstance: string;
  setSelectedInstance: (id: string) => void;
  installedStatus: Record<string, boolean>;
  isRunning: boolean;
  installingInstance: string | null;
  fadeAndLaunch: () => void;
  playSfx: (name: string, multiplier?: number) => void;
  setActiveTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  username,
  selectedInstance,
  setSelectedInstance,
  installedStatus,
  isRunning,
  installingInstance,
  fadeAndLaunch,
  playSfx,
  setActiveTab,
}) => {
  const hasInstalledInstance = installedStatus.vanilla_tu19 || installedStatus.vanilla_tu24;

  return (
    <div className="flex flex-col items-center text-center animate-in fade-in w-full">
      <div className="relative mb-12 flex flex-col items-center">
        <img src="/images/MenuTitle.png" className="w-[600px] drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)]" alt="Menu Title" />
        <div className="splash-text absolute bottom-0 -right-4 text-3xl">
          Welcome, {username}!
        </div>
      </div>
      
      <div className="bg-black/60 backdrop-blur-sm p-10 border-4 border-stone-800 w-[600px] flex flex-col gap-8 mt-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
        
        {hasInstalledInstance ? (
          <>
            <select
              value={selectedInstance}
              onChange={(e) => {
                playSfx('click.wav');
                setSelectedInstance(e.target.value);
              }}
              className="w-full bg-[#bebebe] border-4 border-black p-3 text-2xl outline-none text-[#3e3e3e] shadow-[inset_4px_4px_#ffffff,_inset_-4px_-4px_#555555] cursor-pointer"
              style={{ fontFamily: 'Minecraft, sans-serif' }}
            >
              {installedStatus.vanilla_tu19 && (
                <option value="vanilla_tu19">Vanilla Nightly (TU19)</option>
              )}
              {installedStatus.vanilla_tu24 && (
                <option value="vanilla_tu24">Vanilla TU24</option>
              )}
            </select>

            <button
              onClick={fadeAndLaunch}
              disabled={isRunning || !!installingInstance}
              onMouseEnter={() => playSfx('hover')}
              className={`group relative flex items-center justify-center w-full h-[80px] transition-transform duration-100 ${
                isRunning || !!installingInstance 
                  ? "bg-[url('/images/button.png')] opacity-50 grayscale cursor-not-allowed" 
                  : "bg-[url('/images/button.png')] hover:bg-[url('/images/button_highlighted.png')] hover:scale-105 shadow-2xl cursor-pointer"
              } bg-[length:100%_100%] bg-center bg-no-repeat`}
            >
              <span className="text-[40px] tracking-wider text-[#3e3e3e] group-hover:text-white legacy-text-shadow mt-1" style={{ fontFamily: 'Minecraft, sans-serif' }}>
                {installingInstance ? "WAITING..." : isRunning ? "RUNNING..." : "PLAY"}
              </span>
            </button>
          </>
        ) : (
          <div className="text-center flex flex-col items-center">
            <p className="text-3xl text-red-400 mb-8 font-bold uppercase legacy-text-shadow">Game not installed</p>
            <button
              onClick={() => {
                playSfx('click.wav');
                setActiveTab("versions");
              }}
              onMouseEnter={() => playSfx('hover')}
              className="group relative flex items-center justify-center w-[80%] h-[64px] transition-transform duration-100 bg-[url('/images/button.png')] hover:bg-[url('/images/button_highlighted.png')] hover:scale-105 shadow-2xl cursor-pointer bg-[length:100%_100%] bg-center bg-no-repeat"
            >
              <span className="text-[28px] tracking-wider text-[#3e3e3e] group-hover:text-white legacy-text-shadow mt-1" style={{ fontFamily: 'Minecraft, sans-serif' }}>
                Go to Versions
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};