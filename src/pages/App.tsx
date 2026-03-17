import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
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

const appWindow = getCurrentWindow();

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [logoAnimDone, setLogoAnimDone] = useState(false);
  const [activeView, setActiveView] = useState('main'); 
  const [isUiHidden, setIsUiHidden] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  
  const [profile, setProfile] = useLocalStorage('lce-profile', 'TU75');
  const [installs, setInstalls] = useLocalStorage<string[]>('lce-installs', []);
  const [isDayTime, setIsDayTime] = useLocalStorage('lce-daytime', true);
  const [vfxEnabled, setVfxEnabled] = useLocalStorage('lce-vfx', true);
  const [musicVol, setMusicVol] = useLocalStorage('lce-music', 50);
  const [sfxVol, setSfxVol] = useLocalStorage('lce-sfx', 100);
  const [theme, setTheme] = useLocalStorage('lce-theme', 'Modern');
  const [layout, setLayout] = useLocalStorage('lce-layout', 'KBM');
  const [username, setUsername] = useLocalStorage('lce-username', 'Steve');
  const [skinUrl, setSkinUrl] = useLocalStorage('lce-skin', '/images/Default.png');

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

  const editions = [
    { id: 'TU75', name: 'PLACEHOLDER_TITLE UPDATE', desc: 'TITLE_UPDATE_DESCRIPTION' },
    { id: 'TU24', name: 'PLACEHOLDER_TITLE UPDATE', desc: 'TITLE_UPDATE_DESCRIPTION' },
    { id: 'TU19', name: 'PLACEHOLDER_TITLE UPDATE', desc: 'TITLE_UPDATE_DESCRIPTION' }
  ];
  
  const tracks = [ 
      '/music/Blind Spots.ogg', 
      '/music/Key.ogg', 
      '/music/Living Mice.ogg', 
      '/music/Oxygene.ogg', 
      '/music/Subwoofer Lullaby.ogg' 
  ];

  const playClickSound = () => { const a = new Audio('/sounds/click.wav'); a.volume = sfxVol/100; a.play().catch(()=>{}); };
  const playBackSound = () => { const a = new Audio('/sounds/back_click.ogg'); a.volume = sfxVol/100; a.play().catch(()=>{}); };
  const playSplashSound = () => { const a = new Audio('/sounds/splash_text_click.ogg'); a.volume = sfxVol/100; a.play().catch(()=>{}); };

  const cycleSplash = () => {
    playSplashSound();
    let newIndex;
    do { newIndex = Math.floor(Math.random() * splashes.length); } while (newIndex === splashIndex && splashes.length > 1);
    setSplashIndex(newIndex);
  };

  const toggleInstall = (id: string) => {
    if (!installs.includes(id)) setInstalls([...installs, id]);
  };

  const handleLaunch = () => console.log(`Preparing to launch profile: ${profile}`);

  useEffect(() => {
    appWindow.show();
    setTimeout(() => setShowIntro(false), 2800);
    setTimeout(() => setLogoAnimDone(true), 3400);
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
    if (playPromise !== undefined) playPromise.catch(() => { document.addEventListener('click', () => audio.play(), {once:true}); });
    setAudioElement(audio);
    return () => { audio.removeEventListener('ended', handleEnded); audio.pause(); };
  }, [currentTrack, showIntro]); 

  useEffect(() => { if (audioElement) audioElement.volume = musicVol / 100; }, [musicVol, audioElement]);

  useEffect(() => {
    invoke('save_config', { config: { username, skinBase64: skinUrl, themeStyleId: theme } }).catch(() => {});
  }, [username, skinUrl, theme, musicVol, sfxVol, vfxEnabled]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const uiFade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 } };

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

      <AnimatePresence>
        {showCredits && <TeamModal isOpen={showCredits} onClose={() => setShowCredits(false)} playClickSound={playClickSound} playBackSound={playBackSound} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(12px)" }} className="flex flex-1 items-center justify-center z-10 pointer-events-none">
            <motion.img layoutId="mainLogo" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} src="/images/MenuTitle.png" className="w-3/4 max-w-3xl" style={{ imageRendering: 'pixelated' }} />
          </motion.div>
        ) : (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full z-10 w-full relative">
            
            <AnimatePresence>
              {logoAnimDone && (
                <motion.div key="header" {...uiFade} data-tauri-drag-region className="h-10 w-full flex justify-between items-center px-2 absolute top-0 left-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
                  <div data-tauri-drag-region className="pl-2 text-sm text-gray-300 mc-text-shadow opacity-80">Emerald Legacy Launcher</div>
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
                
                {activeView === 'main' && <SkinViewer username={username} setUsername={setUsername} playClickSound={playClickSound} skinUrl={skinUrl} setSkinUrl={setSkinUrl} setActiveView={setActiveView} />}

                <div className="w-full max-w-4xl relative flex justify-center items-center">
                  <AnimatePresence mode="wait">
                    {activeView === 'main' && <HomeView handleLaunch={handleLaunch} setActiveView={setActiveView} playClickSound={playClickSound} setShowCredits={setShowCredits} />}
                    {activeView === 'settings' && <SettingsView vfxEnabled={vfxEnabled} setVfxEnabled={setVfxEnabled} music={musicVol} setMusic={setMusicVol} sfx={sfxVol} setSfx={setSfxVol} layout={layout} setLayout={setLayout} currentTrack={currentTrack} setCurrentTrack={setCurrentTrack} tracks={tracks} playClickSound={playClickSound} playBackSound={playBackSound} setActiveView={setActiveView} />}
                    {activeView === 'versions' && <VersionsView selectedProfile={profile} setSelectedProfile={setProfile} installedVersions={installs} toggleInstall={toggleInstall} playClickSound={playClickSound} playBackSound={playBackSound} setActiveView={setActiveView} editions={editions} />}
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
                  <div className="flex-1 text-left whitespace-nowrap">Version: EmeraldLauncher-1.0.0</div>
                  <div className="flex-[2] text-center whitespace-nowrap">Not affiliated with Mojang AB or Microsoft. "Minecraft" is a trademark of Mojang Synergies AB.</div>
                  <div className="flex-1 text-right whitespace-nowrap"></div>
                </motion.footer>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}