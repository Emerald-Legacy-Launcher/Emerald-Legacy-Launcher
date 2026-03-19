import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TauriService } from '../../services/TauriService';
import CustomTUModal from '../modals/CustomTUModal';

export default function VersionsView({
  selectedProfile, setSelectedProfile,
  installedVersions, toggleInstall,
  playClickSound, playBackSound,
  setActiveView, editions,
  onAddEdition, onDeleteEdition
}: any) {
  const [focusRow, setFocusRow] = useState<number>(0);
  const [focusCol, setFocusCol] = useState<number>(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const ITEM_COUNT = editions.length + 2;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'Escape' || e.key === 'Backspace') {
        playBackSound();
        setActiveView('main');
        return;
      }

      if (e.key === 'ArrowDown') {
        setFocusRow(prev => (prev >= ITEM_COUNT - 1) ? 0 : prev + 1);
        setFocusCol(0);
      } else if (e.key === 'ArrowUp') {
        setFocusRow(prev => (prev <= 0) ? ITEM_COUNT - 1 : prev - 1);
        setFocusCol(0);
      } else if (e.key === 'ArrowRight') {
        if (focusRow < editions.length) {
          const isInstalled = installedVersions.includes(editions[focusRow].id);
          const maxCol = isInstalled ? 2 : 1;
          setFocusCol(prev => prev < maxCol ? prev + 1 : prev);
        }
      } else if (e.key === 'ArrowLeft') {
        setFocusCol(prev => prev > 0 ? prev - 1 : prev);
      } else if (e.key === 'Enter') {
        if (focusRow < editions.length) {
          const edition = editions[focusRow];
          const isInstalled = installedVersions.includes(edition.id);
          if (focusCol === 0) {
            if (isInstalled) {
              playClickSound();
              setSelectedProfile(edition.id);
            } else {
              playClickSound();
              toggleInstall(edition.id);
            }
          } else if (focusCol === 1) {
            playClickSound();
            toggleInstall(edition.id);
          } else if (focusCol === 2) {
            playClickSound();
            TauriService.openInstanceFolder(edition.id);
          }
        } else if (focusRow === editions.length) {
          playClickSound();
          setIsImportModalOpen(true);
        } else {
          playBackSound();
          setActiveView('main');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusRow, focusCol, editions, installedVersions, playClickSound, playBackSound, setSelectedProfile, setActiveView, toggleInstall, ITEM_COUNT]);

  useEffect(() => {
    const el = containerRef.current?.querySelector(`[data-row="${focusRow}"][data-col="${focusCol}"]`) as HTMLElement;
    if (el) el.focus();
  }, [focusRow, focusCol]);

  return (
    <motion.div ref={containerRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center w-full max-w-4xl outline-none">
      <h2 className="text-2xl text-white mc-text-shadow mb-4 border-b-2 border-[#373737] pb-2 w-[40%] max-w-[200px] text-center tracking-widest uppercase opacity-80 font-bold">Versions</h2>

      <div className="w-full max-w-[740px] h-[380px] overflow-y-auto mb-6 p-6 relative">
        <div className="flex flex-col gap-3">
          {editions.map((edition: any, i: number) => {
            const isInstalled = installedVersions.includes(edition.id);
            const isSelected = selectedProfile === edition.id;
            const isRowFocused = focusRow === i;
            const isCustom = edition.id.startsWith('custom_');

            return (
              <div
                key={edition.id}
                className={`w-full flex items-center transition-all border-none outline-none overflow-hidden`}
                style={{
                  backgroundImage: (isSelected || (isRowFocused && focusCol === 0)) ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')",
                  backgroundSize: "100% 100%",
                  imageRendering: "pixelated"
                }}
              >
                <div
                  data-row={i} data-col={0} tabIndex={0}
                  onMouseEnter={() => { setFocusRow(i); setFocusCol(0); }}
                  onClick={() => { if (isInstalled) { playClickSound(); setSelectedProfile(edition.id); } else { toggleInstall(edition.id); } }}
                  className="flex-1 p-4 flex items-center cursor-pointer outline-none pl-6 text-left relative"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl mc-text-shadow ${(isSelected || (isRowFocused && focusCol === 0)) ? 'text-[#FFFF55]' : 'text-white'}`}>{edition.name}</span>
                      {isCustom && <span className="text-[10px] bg-[#FFFF55] text-black px-1 font-bold uppercase mc-text-shadow-none">Custom</span>}
                    </div>
                    <span className="text-base text-[#E0E0E0] mc-text-shadow truncate w-full">{edition.desc}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 pr-6">
                  {!isInstalled ? (
                    <button
                      data-row={i} data-col={1}
                      onMouseEnter={() => { setFocusRow(i); setFocusCol(1); }}
                      onClick={(e) => { e.stopPropagation(); playClickSound(); toggleInstall(edition.id); }}
                      className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none transition-all"
                      style={{ backgroundImage: (isRowFocused && focusCol === 1) ? "url('/images/Button_Square_Highlighted.png')" : "url('/images/Button_Square.png')", backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
                    >
                      <img src="/images/Download_Icon.png" alt="Download" className="w-8 h-8 object-contain pointer-events-none drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                    </button>
                  ) : (
                    <>
                      <button
                        data-row={i} data-col={1}
                        onMouseEnter={() => { setFocusRow(i); setFocusCol(1); }}
                        onClick={(e) => { e.stopPropagation(); playClickSound(); toggleInstall(edition.id); }}
                        className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none transition-all"
                        style={{ backgroundImage: (isRowFocused && focusCol === 1) ? "url('/images/Button_Square_Highlighted.png')" : "url('/images/Button_Square.png')", backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
                      >
                        <img src="/images/Update_Icon.png" alt="Update" className="w-8 h-8 object-contain pointer-events-none drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                      </button>
                      <button
                        data-row={i} data-col={2}
                        onMouseEnter={() => { setFocusRow(i); setFocusCol(2); }}
                        onClick={(e) => { e.stopPropagation(); playClickSound(); TauriService.openInstanceFolder(edition.id); }}
                        className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none transition-all"
                        style={{ backgroundImage: (isRowFocused && focusCol === 2) ? "url('/images/Button_Square_Highlighted.png')" : "url('/images/Button_Square.png')", backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
                      >
                        <img src="/images/Folder_Icon.png" alt="Folder" className="w-8 h-8 object-contain pointer-events-none drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                      </button>
                    </>
                  )}
                  {isCustom && (
                    <button
                      data-row={i} data-col={3}
                      onMouseEnter={() => { setFocusRow(i); setFocusCol(3); }}
                      onClick={(e) => { e.stopPropagation(); playBackSound(); onDeleteEdition(edition.id); }}
                      className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none transition-all"
                      style={{ backgroundImage: (isRowFocused && focusCol === 3) ? "url('/images/Button_Square_Highlighted.png')" : "url('/images/Button_Square.png')", backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" className="text-red-500 drop-shadow-md"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          data-row={editions.length} data-col={0}
          onMouseEnter={() => { setFocusRow(editions.length); setFocusCol(0); }}
          onClick={() => { playClickSound(); setIsImportModalOpen(true); }}
          className={`w-72 h-14 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none ${focusRow === editions.length ? 'text-[#FFFF55]' : 'text-white'}`}
          style={{
            backgroundImage: focusRow === editions.length ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')",
            backgroundSize: '100% 100%',
            imageRendering: 'pixelated'
          }}
        >
          Import Custom TU
        </button>

        <button
          data-row={editions.length + 1} data-col={0}
          onMouseEnter={() => { setFocusRow(editions.length + 1); setFocusCol(0); }}
          onClick={() => { playBackSound(); setActiveView('main'); }}
          className={`w-72 h-14 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none ${focusRow === editions.length + 1 ? 'text-[#FFFF55]' : 'text-white'}`}
          style={{
            backgroundImage: focusRow === editions.length + 1 ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')",
            backgroundSize: '100% 100%',
            imageRendering: 'pixelated'
          }}
        >
          Back
        </button>
      </div>

      <CustomTUModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(ed: any) => {
          const id = onAddEdition(ed);
          setSelectedProfile(id);
        }}
        playClickSound={playClickSound}
        playBackSound={playBackSound}
      />
    </motion.div>
  );
}
