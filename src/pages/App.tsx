import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useLocalStorage } from '../hooks/useLocalStorage';
import HomeView from '../components/views/HomeView';
import SettingsView from '../components/views/SettingsView';
import VersionsView from '../components/views/VersionsView';
import ThemesView from '../components/views/ThemesView';
import SkinsView from '../components/views/SkinsView';
import MarketplaceView from '../components/views/MarketplaceView';
import SkinViewer from '../components/common/SkinViewer';
import TeamModal from '../components/modals/TeamModal';
import PanoramaBackground from '../components/common/PanoramaBackground';
import { ClickParticles } from '../components/common/ClickParticles';
import { useGamepad } from '../hooks/useGamepad';
import { TauriService } from '../services/TauriService';
import RpcService from '../services/RpcService';
const appWindow = getCurrentWindow();
export default function App() {
  return (
    <AppContent />
  );
}


function AppContent() {
  const [showIntro, setShowIntro] = useState(true);
  const [logoAnimDone, setLogoAnimDone] = useState(false);
  const [activeView, setActiveView] = useState('main');
  const [isUiHidden, setIsUiHidden] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [focusSection, setFocusSection] = useState<'menu' | 'skin'>('menu');
  const [profile, setProfile] = useLocalStorage('lce-profile', 'legacy_evolved');
  const [installs, setInstalls] = useState<string[]>([]);
  const [isDayTime, setIsDayTime] = useLocalStorage('lce-daytime', true);
  const [vfxEnabled, setVfxEnabled] = useLocalStorage('lce-vfx', true);
  const [musicVol, setMusicVol] = useLocalStorage('lce-music', 50);
  const [sfxVol, setSfxVol] = useLocalStorage('lce-sfx', 100);
  const [theme, setTheme] = useLocalStorage('lce-theme', 'Modern');
  const [layout, setLayout] = useLocalStorage('lce-layout', 'KBM');
  const [username, setUsername] = useLocalStorage('lce-username', 'Steve');
  const [skinUrl, setSkinUrl] = useLocalStorage('lce-skin', '/images/Default.png');
  const [skinBase64, setSkinBase64] = useState<string | null>(null);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [linuxRunner, setLinuxRunner] = useState<string | undefined>();
  const [perfBoost, setPerfBoost] = useState(false);
  const [customEditions, setCustomEditions] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const splashes = [
    "Legacy is back!", "Pixelated goodness!", "Console Edition vibe!", "100% Not Microsoft!",
    "Symmetry is key!", "Does anyone even read these?", "Task failed successfully.",
    "Hardware accelerated!", "It's a feature, not a bug.", "Look behind you.",
    "Works on my machine.", "Now gluten-free!", "Mom, get the camera!", "Batteries not included.",
    "May contain nuts.", "Press Alt+F4 for diamonds!", "Downloading more RAM...", "Reinventing the wheel!",
    "The cake is a lie.", "Powered by copious amounts of coffee.", "I'm running out of ideas.",
    "That's no moon...", "Now with 100% more nostalgia!", "Legacy is the new modern.",
    "No microtransactions!", "As seen on TV!", "Ironic, isn't it?", "Creeper? Aww man.",
    "Technoblade never dies!"
  ];
  const [splashIndex, setSplashIndex] = useState(-1);
  const baseEditions = [
    { id: 'legacy_evolved', name: 'Legacy Evolved', desc: 'Backporting the newer title updates back to the LCE', url: 'https://github.com/piebotc/LegacyEvolved/releases/download/nightly/LCEWindows64.zip' },
    { id: 'vanilla_tu24', name: 'Title Update 24', desc: 'Based on TU19, but with the features of TU24.', url: 'https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu24_vanilla.zip' },
    { id: 'vanilla_tu19', name: 'Title Update 19', desc: 'Leaked 4J Studios build. (smartcmd)', url: "https://github.com/smartcmd/MinecraftConsoles/releases/download/nightly/LCEWindows64.zip" }
  ];

  const editions = [...baseEditions, ...customEditions];

  const addCustomEdition = (edition: { name: string, desc: string, url: string }) => {
    const id = `custom_${Date.now()}`;
    const newEdition = { ...edition, id };
    setCustomEditions(prev => [...prev, newEdition]);
    return id;
  };

  const deleteCustomEdition = (id: string) => {
    setCustomEditions(prev => prev.filter(e => e.id !== id));
    TauriService.deleteInstance(id).catch(console.error);
  };

  const tracks = [
    '/music/Blind Spots.ogg',
    '/music/Key.ogg',
    '/music/Living Mice.ogg',
    '/music/Oxygene.ogg',
    '/music/Subwoofer Lullaby.ogg'
  ];

  const playClickSound = () => { const a = new Audio('/sounds/click.wav'); a.volume = sfxVol / 100; a.play().catch(() => { }); };
  const playBackSound = () => { const a = new Audio('/sounds/back_click.ogg'); a.volume = sfxVol / 100; a.play().catch(() => { }); };
  const playSfx = (file: string) => { const a = new Audio(`/sounds/${file}`); a.volume = sfxVol / 100; a.play().catch(() => { }); };
  const playSplashSound = () => { const a = new Audio('/sounds/splash_text_click.ogg'); a.volume = sfxVol / 100; a.play().catch(() => { }); };
  const cycleSplash = () => {
    playSplashSound();
    let newIndex;
    do { newIndex = Math.floor(Math.random() * splashes.length); } while (newIndex === splashIndex && splashes.length > 1);
    setSplashIndex(newIndex);
  };

  const checkInstalls = async () => {
    const results = await Promise.all(editions.map(async (e) => {
      const isInstalled = await TauriService.checkGameInstalled(e.id);
      return isInstalled ? e.id : null;
    }));
    setInstalls(results.filter((id): id is string => id !== null));
  };

  const toggleInstall = async (id: string) => {
    const edition = editions.find(e => e.id === id);
    if (!edition) return;
    try {
      setDownloadingId(id);
      setDownloadProgress(0);
      await TauriService.downloadAndInstall(edition.url, id);
      await checkInstalls();
      setDownloadProgress(null);
      setDownloadingId(null);
    } catch (e) {
      console.error(e);
      setDownloadProgress(null);
      setDownloadingId(null);
    }
  };

  const { connected } = useGamepad({
    playSfx
  });

  useEffect(() => {
    appWindow.show();
    setTimeout(() => setShowIntro(false), 2800);
    setTimeout(() => setLogoAnimDone(true), 3400);
    TauriService.loadConfig().then(config => {
      if (config.username) setUsername(config.username);
      if (config.skinBase64) setSkinUrl(config.skinBase64);
      if (config.themeStyleId) setTheme(config.themeStyleId);
      if (config.linuxRunner) setLinuxRunner(config.linuxRunner);
      if (config.appleSiliconPerformanceBoost !== undefined) setPerfBoost(config.appleSiliconPerformanceBoost);
      if (config.customEditions) setCustomEditions(config.customEditions);
    });

    checkInstalls();
    const unlistenDownload = TauriService.onDownloadProgress(p => setDownloadProgress(p));
    return () => {
      unlistenDownload.then(u => u());
    };
  }, []);

  useEffect(() => {
    if (activeView === 'main') {
      setSplashIndex(-1);
    }
  }, [activeView]);

  useEffect(() => {
    if (showIntro) return;
    const audio = new Audio(tracks[currentTrack]);
    audio.volume = musicVol / 100;
    const handleEnded = () => setCurrentTrack((prev) => (prev + 1) % tracks.length);
    audio.addEventListener('ended', handleEnded);
    const playPromise = audio.play();
    if (playPromise !== undefined) playPromise.catch(() => { document.addEventListener('click', () => audio.play(), { once: true }); });
    setAudioElement(audio);
    return () => { audio.removeEventListener('ended', handleEnded); audio.pause(); };
  }, [currentTrack, showIntro]);

  useEffect(() => { if (audioElement) audioElement.volume = musicVol / 100; }, [musicVol, audioElement]);
  useEffect(() => {
    const syncSkin = async () => {
      if (!skinUrl) return;
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const cvs = document.createElement("canvas");
          cvs.width = 64;
          cvs.height = 32;
          const ctx = cvs.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, 64, 32, 0, 0, 64, 32);
            setSkinBase64(cvs.toDataURL("image/png"));
          }
        };
        img.src = skinUrl;
      } catch (e) {
        console.error("Skin conversion failed:", e);
      }
    };
    syncSkin();
  }, [skinUrl]);

  useEffect(() => {
    if (!skinBase64 && skinUrl && !skinUrl.startsWith('data:')) return;
    TauriService.saveConfig({
      username,
      skinBase64: skinBase64 || skinUrl,
      themeStyleId: theme,
      linuxRunner,
      appleSiliconPerformanceBoost: perfBoost,
      customEditions
    }).catch(() => { });
  }, [username, skinBase64, theme, linuxRunner, perfBoost, customEditions]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const uiFade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 } };

  const handleLaunch = async () => {
    if (isGameRunning) return;
    setIsGameRunning(true);
    try {
      await TauriService.launchGame(profile, []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGameRunning(false);
    }
  };

  const stopGame = async () => {
    try {
      await TauriService.stopGame();
      setIsGameRunning(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const updateRPC = async () => {
      if (showIntro || !username) return;

      const version = editions.find(e => e.id === profile);
      const versionName = version ? version.name : "Unknown Version";

      let details = "In Menus";
      let state = `Playing as ${username}`;

      if (isGameRunning) {
        details = `Playing ${versionName}`;
      } else {
        const tabNames: Record<string, string> = {
          main: "Main Menu",
          versions: "Selecting Version",
          settings: "In Settings",
          themes: "Browsing Themes",
          skins: "Browsing Skins",
          marketplace: "Browsing Marketplace"
        };
        details = tabNames[activeView] || "In Menus";
      }

      await RpcService.updateActivity(details, state, isGameRunning);
    };

    updateRPC();
  }, [username, isGameRunning, profile, activeView, showIntro, editions]);

  return (
    <div data-tauri-drag-region className="w-screen h-screen overflow-hidden select-none flex flex-col relative bg-black text-white font-['Mojangles'] outline-none focus:outline-none">
      <style>{`
        @keyframes splashPulse { 0% { transform: scale(0.95) rotate(-20deg); } 100% { transform: scale(1.08) rotate(-20deg); } }
        .mc-splash { animation: splashPulse 0.4s ease-in-out infinite alternate; transform-origin: center; }
        .mc-slider-custom { -webkit-appearance: none; appearance: none; background: transparent; height: 100%; outline: none; border: none; margin: 0; padding: 0; }
        .mc-slider-custom::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 44px; background: url('/images/Slider_Handle.png') no-repeat center; background-size: 100% 100%; cursor: pointer; position: relative; z-index: 30; }
        *:focus { outline: none !important; box-shadow: none !important; }
        button, input { border-radius: 0 !important; border: none !important; outline: none !important; box-shadow: none !important; }
        .mc-sq-btn { background: url('/images/Button_Square.png') no-repeat center; background-size: 100% 100%; image-rendering: pixelated; }
        .mc-sq-btn:hover { background: url('/images/Button_Square_Highlighted.png') no-repeat center; background-size: 100% 100%; }
      `}</style>

      <PanoramaBackground profile={profile} isDay={isDayTime} />
      {vfxEnabled && <ClickParticles />}
      <AnimatePresence>
        {showCredits && <TeamModal isOpen={showCredits} onClose={() => setShowCredits(false)} playClickSound={playClickSound} playBackSound={playBackSound} />}
      </AnimatePresence>
      <AnimatePresence>
        {downloadProgress !== null && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute top-14 right-8 z-[100] w-64 p-4 shadow-2xl flex flex-col gap-2"
            style={{ backgroundImage: "url('/images/Download_Background.png')", backgroundSize: "100% 100%", imageRendering: "pixelated" }}
          >
            <div className="flex flex-col gap-1 w-full">
              <span className="text-[15px] text-[#FFFF55] mc-text-shadow uppercase tracking-widest text-center w-full">Downloading</span>
              <div className="text-[10px] text-gray-300 mc-text-shadow truncate uppercase opacity-80 pb-1 text-center w-full">
                {editions.find(e => e.id === downloadingId)?.name || 'Game Files'}
              </div>
              <div className="flex items-center gap-2 w-full">
                <span className="text-[10px] text-white mc-text-shadow w-6 text-right shrink-0 flex items-center justify-end h-[14px] leading-none">{Math.floor(downloadProgress)}%</span>
                <div className="flex-1 h-[14px] border-2 border-white bg-black/40 relative">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <div className="w-6 flex items-center justify-start shrink-0">
                  <img src="/images/loading.gif" alt="Loading" className="w-4 h-4 object-contain" style={{ imageRendering: 'pixelated' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIntro ? (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(12px)" }} className="flex flex-1 items-center justify-center z-10 pointer-events-none">
            <motion.img layoutId="mainLogo" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} src="/images/MenuTitle.png" className="w-3/4 max-w-3xl" style={{ imageRendering: 'pixelated' }} />
          </motion.div>
        ) : (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full z-10 w-full relative">

            <AnimatePresence>
              {logoAnimDone && (
                <motion.div key="header" {...uiFade} data-tauri-drag-region className="h-10 w-full flex justify-between items-center px-1 absolute top-0 left-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
                  <div data-tauri-drag-region className="pl-3 flex items-center justify-center gap-[6px] pointer-events-none h-full pt-[2px]">
                    <img src="/images/icon.png" alt="Icon" className="w-[16px] h-[16px] object-contain block" style={{ imageRendering: 'pixelated' }} />
                    <span className="text-xs text-gray-300 mc-text-shadow opacity-90 tracking-wide leading-none block pt-[1px]">Emerald Legacy Launcher</span>
                  </div>
                  <div className="flex items-center gap-1 pr-2">
                    <button onClick={() => { playClickSound(); appWindow.minimize(); }} className="w-10 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all bg-transparent"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                    <button onClick={() => { playClickSound(); appWindow.toggleMaximize(); }} className="w-10 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all bg-transparent"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square"><rect x="3" y="3" width="18" height="18"></rect></svg></button>
                    <button onClick={() => { playClickSound(); appWindow.close(); }} className="w-10 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-red-600 transition-all bg-transparent"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {logoAnimDone && (
                <>
                  <motion.div key="hideBtn" {...uiFade} className="absolute top-14 left-8 z-50">
                    <button onClick={() => { playClickSound(); setIsUiHidden(!isUiHidden); }} className="hover:scale-110 active:scale-95 transition-transform outline-none bg-transparent border-none">
                      <img src={isUiHidden ? '/images/Unhide_UI_Button.png' : '/images/Hide_UI_Button.png'} className="w-10 h-10 cursor-pointer object-contain" style={{ imageRendering: 'pixelated' }} />
                    </button>
                  </motion.div>

                  <motion.div key="dayToggle" {...uiFade} className="absolute bottom-6 right-8 z-50 flex items-center gap-3">
                    <span className="text-[#E0E0E0] text-[10px] mc-text-shadow tracking-widest uppercase opacity-70 mt-1">{isDayTime ? 'Day' : 'Night'}</span>
                    <button onClick={() => { playClickSound(); setIsDayTime(!isDayTime); }} className="hover:scale-110 active:scale-95 transition-transform outline-none bg-transparent border-none">
                      <img src={isDayTime ? '/images/Day_Toggle.png' : '/images/Night_Toggle.png'} alt="Toggle Time" className="w-12 h-12 cursor-pointer block object-contain" style={{ imageRendering: 'pixelated' }} />
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div data-tauri-drag-region className="shrink-0 flex justify-center py-4 relative w-full pt-12">
              <div className="relative w-full max-w-[540px] flex justify-center">
                <motion.img layoutId="mainLogo" src="/images/MenuTitle.png" className="w-full drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)] pointer-events-none" style={{ imageRendering: 'pixelated' }} />
                <AnimatePresence>
                  {logoAnimDone && (
                    <motion.div key="splash" {...uiFade} className="absolute bottom-[20%] right-[5%] w-0 h-0 flex items-center justify-center">
                      <div onClick={cycleSplash} className="mc-splash text-[#FFFF55] text-[28px] cursor-pointer whitespace-nowrap" style={{ textShadow: '2px 2px 0px #3F3F00' }}>
                        {splashIndex === -1 ? `Welcome ${username}!` : splashes[splashIndex]}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <main className="flex-1 w-full relative">
              <div className={`w-full h-full flex flex-col items-center justify-center transition-opacity duration-300 ${(!logoAnimDone || isUiHidden) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                {activeView === 'main' && (
                  <SkinViewer
                    username={username} setUsername={setUsername}
                    playClickSound={playClickSound} skinUrl={skinUrl}
                    setSkinUrl={setSkinUrl} setActiveView={setActiveView}
                    isFocusedSection={focusSection === 'skin'}
                    onNavigateRight={() => setFocusSection('menu')}
                  />
                )}

                <div className="w-full max-w-4xl relative flex justify-center items-center">
                  <AnimatePresence>
                    {activeView === 'main' && (
                      <HomeView
                        handleLaunch={handleLaunch} setActiveView={setActiveView}
                        playClickSound={playClickSound} setShowCredits={setShowCredits}
                        isFocusedSection={focusSection === 'menu'}
                        onNavigateLeft={() => setFocusSection('skin')}
                        isGameRunning={isGameRunning} stopGame={stopGame}
                      />
                    )}
                    {activeView === 'settings' && <SettingsView vfxEnabled={vfxEnabled} setVfxEnabled={setVfxEnabled} music={musicVol} setMusic={setMusicVol} sfx={sfxVol} setSfx={setSfxVol} layout={layout} setLayout={setLayout} currentTrack={currentTrack} setCurrentTrack={setCurrentTrack} tracks={tracks} playClickSound={playClickSound} playBackSound={playBackSound} setActiveView={setActiveView} linuxRunner={linuxRunner} setLinuxRunner={setLinuxRunner} perfBoost={perfBoost} setPerfBoost={setPerfBoost} />}
                    {activeView === 'versions' && <VersionsView selectedProfile={profile} setSelectedProfile={setProfile} installedVersions={installs} toggleInstall={toggleInstall} playClickSound={playClickSound} playBackSound={playBackSound} setActiveView={setActiveView} editions={editions} onAddEdition={addCustomEdition} onDeleteEdition={deleteCustomEdition} />}
                    {activeView === 'marketplace' && <MarketplaceView playBackSound={playBackSound} setActiveView={setActiveView} />}
                    {activeView === 'themes' && <ThemesView theme={theme} setTheme={setTheme} playClickSound={playClickSound} playBackSound={playBackSound} setActiveView={setActiveView} />}
                    {activeView === 'skins' && <SkinsView skinUrl={skinUrl} setSkinUrl={setSkinUrl} playClickSound={playClickSound} playBackSound={playBackSound} setActiveView={setActiveView} />}
                  </AnimatePresence>
                </div>
              </div>
            </main>

            <AnimatePresence>
              {logoAnimDone && (
                <motion.footer key="footer" {...uiFade} className="shrink-0 p-4 flex justify-between items-end text-[10px] text-[#A0A0A0] mc-text-shadow bg-gradient-to-t from-black/80 to-transparent uppercase tracking-widest opacity-60 font-['Mojangles']" style={{ fontWeight: 'normal' }}>
                  <div className="flex-1 text-left whitespace-nowrap">Version: 1.0.0</div>
                  <div className="flex-[2] text-center whitespace-nowrap">Not affiliated with Mojang AB or Microsoft. "Minecraft" is a trademark of Mojang Synergies AB.</div>
                  <div className="flex-1 text-right whitespace-nowrap">{connected && "CONTROLLER CONNECTED"}</div>
                </motion.footer>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}