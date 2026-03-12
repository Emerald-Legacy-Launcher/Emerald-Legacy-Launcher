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
    <div className="flex flex-col items-center text-center animate-in fade-in">
      <div className="relative mb-12 flex flex-col items-center">
        <img src="/images/MenuTitle.png" className="w-[550px]" alt="Menu Title" />
        <div className="splash-text absolute bottom-2 -right-12 text-3xl">
          Welcome, {username}!
        </div>
      </div>
      <div className="bg-black/80 p-8 border-4 border-black w-[550px] flex flex-col gap-6 mt-12">
        {hasInstalledInstance ? (
          <>
            <select
              value={selectedInstance}
              onChange={(e) => {
                playSfx('click.wav');
                setSelectedInstance(e.target.value);
              }}
              className="w-full legacy-select p-3 text-2xl outline-none"
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
              className="legacy-btn py-4 text-6xl w-full"
            >
              {installingInstance ? "WAITING..." : isRunning ? "RUNNING..." : "PLAY"}
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-2xl text-red-400 mb-6 font-bold uppercase">Game not installed</p>
            <button
              onClick={() => {
                playSfx('click.wav');
                setActiveTab("versions");
              }}
              className="legacy-btn py-4 px-8 text-3xl w-full"
            >
              Go to Versions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
