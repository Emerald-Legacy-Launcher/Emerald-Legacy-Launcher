import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function MarketplaceView({ playBackSound, setActiveView }: any) {
  const [backHover, setBackHover] = useState(false);

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

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      className="flex flex-col items-center w-full max-w-2xl -mt-24"
    >
      <h2 className="text-2xl text-white mc-text-shadow mb-4 border-b-2 border-[#373737] pb-2 w-[60%] max-w-[300px] text-center tracking-widest uppercase opacity-80">Marketplace</h2>
      
      <div className="w-full max-w-[540px] h-48 mb-6 p-8 shadow-2xl flex items-center justify-center" style={{ backgroundImage: "url('/images/frame_background.png')", backgroundSize: "100% 100%", imageRendering: "pixelated" }}>
          <span className="text-[#E0E0E0] text-xl mc-text-shadow tracking-wide">Marketplace support coming soon...</span>
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