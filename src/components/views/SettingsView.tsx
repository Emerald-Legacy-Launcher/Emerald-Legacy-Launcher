import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SettingsView({ 
  vfxEnabled, setVfxEnabled, 
  music: musicVolume, setMusic: setMusicVolume, 
  sfx: sfxVolume, setSfx: setSfxVolume, 
  layout, setLayout, 
  currentTrack, setCurrentTrack,
  tracks,
  playClickSound, playBackSound, setActiveView 
}: any) {
  const [backHover, setBackHover] = useState(false);
  const [musicHover, setMusicHover] = useState(false);
  const [sfxHover, setSfxHover] = useState(false);
  const [vfxHover, setVfxHover] = useState(false);
  const [trackHover, setTrackHover] = useState(false);
  const [layoutHover, setLayoutHover] = useState(false);

  const layouts = ["KBM", "PLAYSTATION", "XBOX"];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        playBackSound();
        setActiveView('main');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playBackSound, setActiveView]);

  const handleLayoutToggle = () => {
    playClickSound();
    const currentIndex = layouts.indexOf(layout);
    const nextIndex = (currentIndex + 1) % layouts.length;
    setLayout(layouts[nextIndex]);
  };

  const handleVfxToggle = () => {
    if(setVfxEnabled) {
      playClickSound();
      setVfxEnabled(!vfxEnabled);
    }
  };

  const handleTrackToggle = () => {
    playClickSound();
    if (setCurrentTrack && tracks) {
      setCurrentTrack((currentTrack + 1) % tracks.length);
    }
  };

  let trackName = "Unknown";
  if (tracks && tracks.length > 0) {
     const fullPath = tracks[currentTrack];
     trackName = fullPath.split('/').pop().replace('.ogg', '').replace('.wav', '');
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center w-full max-w-2xl">
      <h2 className="text-2xl text-white mc-text-shadow mb-4 border-b-2 border-[#373737] pb-2 w-[40%] max-w-[200px] text-center tracking-widest uppercase opacity-80">Settings</h2>
      
      <div className="w-full max-w-[540px] space-y-4 mb-8 p-6 flex flex-col items-center">

        <div 
          onMouseEnter={() => setMusicHover(true)} onMouseLeave={() => setMusicHover(false)}
          className="relative w-[360px] h-12 flex items-center justify-center cursor-pointer transition-all outline-none border-none hover:text-[#FFFF55]" 
          style={{ backgroundImage: "url('/images/Button_Background2.png')", backgroundSize: "100% 100%", imageRendering: "pixelated" }}
        >
          <span className={`absolute z-10 text-2xl mc-text-shadow pointer-events-none transition-colors tracking-widest ${musicHover ? 'text-[#FFFF55]' : 'text-white'}`}>
            Music: {musicVolume}%
          </span>
          <div className="absolute w-full h-full flex items-center justify-center">
            <input 
              type="range" min="0" max="100" step="1"
              value={musicVolume} 
              onChange={(e) => setMusicVolume(parseInt(e.target.value))} 
              onMouseUp={playClickSound} 
              className="mc-slider-custom w-[calc(100%+16px)] h-full opacity-100 cursor-pointer z-20 outline-none m-0" 
            />
          </div>
        </div>

        <div 
          onMouseEnter={() => setSfxHover(true)} onMouseLeave={() => setSfxHover(false)}
          className="relative w-[360px] h-12 flex items-center justify-center cursor-pointer transition-all outline-none border-none hover:text-[#FFFF55]" 
          style={{ backgroundImage: "url('/images/Button_Background2.png')", backgroundSize: "100% 100%", imageRendering: "pixelated" }}
        >
          <span className={`absolute z-10 text-2xl mc-text-shadow pointer-events-none transition-colors tracking-widest ${sfxHover ? 'text-[#FFFF55]' : 'text-white'}`}>
            SFX: {sfxVolume}%
          </span>
          <div className="absolute w-full h-full flex items-center justify-center">
            <input 
              type="range" min="0" max="100" step="1"
              value={sfxVolume} 
              onChange={(e) => setSfxVolume(parseInt(e.target.value))} 
              onMouseUp={playClickSound} 
              className="mc-slider-custom w-[calc(100%+16px)] h-full opacity-100 cursor-pointer z-20 outline-none m-0" 
            />
          </div>
        </div>

        <button 
           onMouseEnter={() => setTrackHover(true)}
           onMouseLeave={() => setTrackHover(false)}
           onClick={handleTrackToggle}
           className={`w-[360px] h-12 flex items-center justify-center px-4 relative z-30 transition-colors outline-none border-none hover:text-[#FFFF55] ${trackHover ? 'text-[#FFFF55]' : 'text-white'}`}
           style={{ 
             backgroundImage: trackHover ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", 
             backgroundSize: "100% 100%", 
             imageRendering: "pixelated" 
           }}
        >
           <span className="text-2xl mc-text-shadow tracking-widest truncate w-full text-center">{trackName} - C418</span>
        </button>

        {setVfxEnabled && (
        <button 
           onMouseEnter={() => setVfxHover(true)}
           onMouseLeave={() => setVfxHover(false)}
           onClick={handleVfxToggle}
           className={`w-[360px] h-12 flex items-center justify-center px-4 relative z-30 transition-colors outline-none border-none hover:text-[#FFFF55] ${vfxHover ? 'text-[#FFFF55]' : 'text-white'}`}
           style={{ 
             backgroundImage: vfxHover ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", 
             backgroundSize: "100% 100%", 
             imageRendering: "pixelated" 
           }}
        >
           <span className="text-2xl mc-text-shadow tracking-widest">VFX: {vfxEnabled ? 'ON' : 'OFF'}</span>
        </button>
        )}

        <button 
           onMouseEnter={() => setLayoutHover(true)}
           onMouseLeave={() => setLayoutHover(false)}
           onClick={handleLayoutToggle}
           className={`w-[360px] h-12 flex items-center justify-center px-4 relative z-30 transition-colors outline-none border-none hover:text-[#FFFF55] ${layoutHover ? 'text-[#FFFF55]' : 'text-white'}`}
           style={{ 
             backgroundImage: layoutHover ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", 
             backgroundSize: "100% 100%", 
             imageRendering: "pixelated" 
           }}
        >
           <span className="text-2xl mc-text-shadow tracking-widest">Layout: {layout}</span>
        </button>

      </div>

      <button 
        onMouseEnter={() => setBackHover(true)} 
        onMouseLeave={() => setBackHover(false)} 
        onClick={() => { playBackSound(); setActiveView('main'); }} 
        className={`w-72 h-12 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none hover:text-[#FFFF55] ${backHover ? 'text-[#FFFF55]' : 'text-white'}`}
        style={{ 
          backgroundImage: backHover ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", 
          backgroundSize: '100% 100%', 
          imageRendering: 'pixelated' 
        }}
      >
        Back
      </button>
    </motion.div>
  );
}