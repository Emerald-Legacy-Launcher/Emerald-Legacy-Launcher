import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ThemesView({ theme, setTheme, playClickSound, playBackSound, setActiveView }: any) {
  const [backHover, setBackHover] = useState(false);
  const [themeHover, setThemeHover] = useState(false);

  const themes = ["Default", "Modern"];

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

  const handleThemeToggle = () => {
    playClickSound();
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center w-full max-w-2xl -mt-24">
      <h2 className="text-2xl text-white mc-text-shadow mb-4 border-b-2 border-[#373737] pb-2 w-[60%] max-w-[300px] text-center tracking-widest uppercase opacity-80">Themes & Tools</h2>
      
      <div className="w-full max-w-[540px] flex flex-col items-center gap-6 mt-4 mb-8">
        <button 
           onMouseEnter={() => setThemeHover(true)}
           onMouseLeave={() => setThemeHover(false)}
           onClick={handleThemeToggle}
           className={`w-72 h-12 flex items-center justify-center px-4 relative transition-colors outline-none border-none hover:text-[#FFFF55] ${themeHover ? 'text-[#FFFF55]' : 'text-white'}`}
           style={{ 
             backgroundImage: themeHover ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", 
             backgroundSize: "100% 100%", 
             imageRendering: "pixelated" 
           }}
        >
           <span className="text-2xl mc-text-shadow tracking-widest">{theme}</span>
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