import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function VersionsView({ selectedProfile, setSelectedProfile, installedVersions, toggleInstall, playClickSound, playBackSound, setActiveView, editions }: any) {
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
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center w-full max-w-4xl">
      <h2 className="text-2xl text-white mc-text-shadow mb-4 border-b-2 border-[#373737] pb-2 w-[40%] max-w-[200px] text-center tracking-widest uppercase opacity-80">Versions</h2>
      
      <div className="w-full max-w-[700px] h-[350px] overflow-y-auto mb-6 p-4 shadow-2xl relative" style={{ backgroundImage: "url('/images/frame_background.png')", backgroundSize: "100% 100%", imageRendering: "pixelated" }}>
        
        <div className="flex flex-col gap-3">
            {editions.map((edition: any) => {
                const isInstalled = installedVersions.includes(edition.id);
                const isSelected = selectedProfile === edition.id;
                
                return (
                    <div 
                        key={edition.id}
                        onClick={() => {
                            if (isInstalled) {
                                playClickSound();
                                setSelectedProfile(edition.id);
                            }
                        }}
                        className={`w-full p-4 flex items-center transition-all outline-none border-none ${isInstalled ? 'cursor-pointer hover:text-[#FFFF55]' : 'opacity-70'}`}
                        style={{ 
                          backgroundImage: isSelected ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", 
                          backgroundSize: "100% 100%", 
                          imageRendering: "pixelated" 
                        }}
                    >
                        <div className="w-[100px] flex-shrink-0"></div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <span className={`text-2xl mc-text-shadow ${isSelected ? 'text-[#FFFF55]' : 'text-white'}`}>{edition.name}</span>
                            <span className="text-base text-[#E0E0E0] mc-text-shadow mt-1">{edition.desc}</span>
                        </div>
                        
                        <div className="flex gap-4 items-center justify-end w-[100px] pr-2">
                            {!isInstalled ? (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); playClickSound(); toggleInstall(edition.id); }}
                                    className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none"
                                >
                                    <img src="/images/Download_Icon.png" className="w-6 h-6 object-contain pointer-events-none drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); playClickSound(); }}
                                        className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none"
                                    >
                                        <img src="/images/Update_Icon.png" className="w-6 h-6 object-contain pointer-events-none drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); playClickSound(); }}
                                        className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none"
                                    >
                                        <img src="/images/Folder_Icon.png" className="w-6 h-6 object-contain pointer-events-none drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

      </div>

      <button 
        onMouseEnter={() => setBackHover(true)} 
        onMouseLeave={() => setBackHover(false)} 
        onClick={() => { playBackSound(); setActiveView('main'); }} 
        className={`w-72 h-14 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none hover:text-[#FFFF55] ${backHover ? 'text-[#FFFF55]' : 'text-white'}`}
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