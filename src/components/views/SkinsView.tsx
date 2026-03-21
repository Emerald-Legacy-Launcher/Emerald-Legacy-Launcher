import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { TauriService } from '../../services/TauriService';
import { useUI, useAudio, useSkin } from '../../context/LauncherContext';

interface SavedSkin {
  id: string;
  name: string;
  url: string;
}

const DEFAULT_SKINS: SavedSkin[] = [
  { id: 'default', name: 'Default Steve', url: '/images/Default.png' },
  { id: 'journ3ym3n', name: 'Journ3ym3n', url: '/Skins/Journ3ym3n.png' },
  { id: 'justneki', name: 'JustNeki', url: '/Skins/JustNeki.png' },
  { id: 'kayjann', name: 'KayJann', url: '/Skins/KayJann.png' },
  { id: 'leon', name: 'Leon', url: '/Skins/Leon.png' },
  { id: 'mr_anilex', name: 'mr_anilex', url: '/Skins/mr_anilex.png' },
  { id: 'neoapps', name: 'neoapps', url: '/Skins/neoapps.png' },
  { id: 'peter', name: 'Peter', url: '/Skins/Peter.png' },
];

const SkinsView = memo(function SkinsView() {
  const { setActiveView } = useUI();
  const { playClickSound, playBackSound } = useAudio();
  const { skinUrl, setSkinUrl } = useSkin();

  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storedSkins, setStoredSkins] = useLocalStorage<SavedSkin[]>('lce-custom-skins', []);
  const savedSkins = [...DEFAULT_SKINS, ...storedSkins.filter(s => !DEFAULT_SKINS.some(d => d.id === s.id))];

  const TOP_BUTTONS_COUNT = 3; // Import, Delete, Folder
  const SKINS_START_INDEX = TOP_BUTTONS_COUNT;
  const BACK_BUTTON_INDEX = SKINS_START_INDEX + savedSkins.length;
  const ITEM_COUNT = BACK_BUTTON_INDEX + 1;

  const setSavedSkins = (newSkins: SavedSkin[] | ((val: SavedSkin[]) => SavedSkin[])) => {
    const updatedSkins = typeof newSkins === 'function' ? newSkins(savedSkins) : newSkins;
    const customOnes = updatedSkins.filter(s => !DEFAULT_SKINS.some(d => d.id === s.id));
    setStoredSkins(customOnes);
  };

  const [activeSkinId, setActiveSkinId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSkinId) {
      const match = savedSkins.find(s => s.url === skinUrl);
      if (match) setActiveSkinId(match.id);
    }
  }, [activeSkinId, savedSkins, skinUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'Escape') {
        playBackSound();
        setActiveView('main');
        return;
      }

      if (e.key === 'ArrowRight') {
        setFocusIndex(prev => (prev === null || prev >= ITEM_COUNT - 1) ? 0 : prev + 1);
      } else if (e.key === 'ArrowLeft') {
        setFocusIndex(prev => (prev === null || prev <= 0) ? ITEM_COUNT - 1 : prev - 1);
      } else if (e.key === 'ArrowDown') {
        if (focusIndex === null || focusIndex < TOP_BUTTONS_COUNT) {
          setFocusIndex(SKINS_START_INDEX);
        } else if (focusIndex < BACK_BUTTON_INDEX) {
          const next = focusIndex + 4;
          setFocusIndex(next >= BACK_BUTTON_INDEX ? BACK_BUTTON_INDEX : next);
        }
      } else if (e.key === 'ArrowUp') {
        if (focusIndex === null) {
          setFocusIndex(0);
        } else if (focusIndex === BACK_BUTTON_INDEX) {
          setFocusIndex(SKINS_START_INDEX + savedSkins.length - 1);
        } else if (focusIndex >= SKINS_START_INDEX) {
          const next = focusIndex - 4;
          setFocusIndex(next < SKINS_START_INDEX ? 0 : next);
        }
      } else if (e.key === 'Enter' && focusIndex !== null) {
        if (focusIndex === 0) handleImportClick();
        else if (focusIndex === 1) handleDeleteActive();
        else if (focusIndex === 2) { playClickSound(); TauriService.openInstanceFolder('Skins').catch(() => { }); }
        else if (focusIndex < BACK_BUTTON_INDEX) {
          handleSkinSelect(savedSkins[focusIndex - SKINS_START_INDEX]);
        } else {
          playBackSound();
          setActiveView('main');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusIndex, savedSkins.length, playBackSound, setActiveView, playClickSound]);

  useEffect(() => {
    if (focusIndex !== null) {
      const el = containerRef.current?.querySelector(`[data-index="${focusIndex}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }, [focusIndex]);

  const handleImportClick = () => {
    playClickSound();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'image/png') return;

    const defaultName = file.name.replace('.png', '').substring(0, 16);
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const cvs = document.createElement("canvas");
        cvs.width = 64;
        cvs.height = 32;
        const ctx = cvs.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 64, 32, 0, 0, 64, 32);
          const base64String = cvs.toDataURL("image/png");
          const newId = Date.now().toString();
          const newSkin = { id: newId, name: defaultName, url: base64String };
          setSavedSkins([...savedSkins, newSkin]);
          setSkinUrl(base64String);
          setActiveSkinId(newId);
        }
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSkinSelect = (skin: SavedSkin) => {
    playClickSound();
    setActiveSkinId(skin.id);
    setSkinUrl(skin.url);
  };

  const isDefaultSkin = (id: string | null) => DEFAULT_SKINS.some(d => d.id === id);

  const handleDeleteActive = () => {
    if (!activeSkinId || isDefaultSkin(activeSkinId)) return;
    playClickSound();
    const updatedSkins = savedSkins.filter(s => s.id !== activeSkinId);
    setSavedSkins(updatedSkins);
    setSkinUrl('/images/Default.png');
    setActiveSkinId('default');
  };

  const handleNameChange = (id: string, newName: string) => {
    const updatedSkins = savedSkins.map(s => s.id === id ? { ...s, name: newName } : s);
    setSavedSkins(updatedSkins);
  };

  const isActiveDefault = isDefaultSkin(activeSkinId) || (!activeSkinId && skinUrl === '/images/Default.png');

  return (
    <motion.div ref={containerRef} tabIndex={-1} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center w-full max-w-3xl outline-none">
      <h2 className="text-2xl text-white mc-text-shadow mt-2 mb-4 border-b-2 border-[#373737] pb-2 w-[60%] max-w-[300px] text-center tracking-widest uppercase opacity-80 font-bold">Skin Library</h2>

      <div className="w-full max-w-[640px] h-[340px] mb-4 p-5 shadow-2xl flex flex-col relative" style={{ backgroundImage: "url('/images/frame_background.png')", backgroundSize: "100% 100%", imageRendering: "pixelated" }}>

        <div className="w-full flex items-center border-b-2 border-[#373737] pb-4 mb-4 relative min-h-[40px]">
          <div className="absolute left-0 right-0 flex justify-center gap-4 items-center">
            <button
              data-index="0"
              onMouseEnter={() => setFocusIndex(0)}
              onClick={handleImportClick}
              className={`w-40 h-10 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none hover:text-[#FFFF55] ${focusIndex === 0 ? 'text-[#FFFF55]' : 'text-white'}`}
              style={{ backgroundImage: focusIndex === 0 ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
            >
              Import Skin
            </button>

            <button
              data-index="1"
              onMouseEnter={() => !isActiveDefault && setFocusIndex(1)}
              onClick={handleDeleteActive}
              className={`w-40 h-10 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none ${isActiveDefault ? 'text-gray-400 opacity-80 cursor-not-allowed' : (focusIndex === 1 ? 'text-[#FFFF55]' : 'text-white')}`}
              style={{
                backgroundImage: isActiveDefault ? "url('/images/Button_Background2.png')" : (focusIndex === 1 ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')"),
                backgroundSize: '100% 100%',
                imageRendering: 'pixelated'
              }}
            >
              Delete Skin
            </button>
          </div>

          <div className="flex-1"></div>
          <div className="flex justify-end z-10">
            <button
              data-index="2"
              onMouseEnter={() => setFocusIndex(2)}
              onClick={() => { playClickSound(); TauriService.openInstanceFolder('Skins').catch(() => { }); }}
              className={`mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none transition-all`}
              style={{ backgroundImage: focusIndex === 2 ? "url('/images/Button_Square_Highlighted.png')" : "url('/images/Button_Square.png')", backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
            >
              <img src="/images/Folder_Icon.png" alt="Skins Folder" className="w-8 h-8 object-contain pointer-events-none drop-shadow-md" style={{ imageRendering: 'pixelated' }} loading="lazy" decoding="async" />
            </button>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".png" className="hidden" />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 flex flex-wrap gap-x-8 gap-y-6 items-start content-start justify-center">
          {savedSkins.map((skin, i) => {
            const idx = SKINS_START_INDEX + i;
            const isActive = activeSkinId ? activeSkinId === skin.id : skinUrl === skin.url;
            const isFocused = focusIndex === idx;
            return (
              <div key={skin.id} data-index={idx} tabIndex={0} onMouseEnter={() => setFocusIndex(idx)} className="flex flex-col items-center gap-1 w-32 outline-none">
                <div className="h-4">
                  {isActive && <span className="text-[#FFFF55] text-xs mc-text-shadow uppercase tracking-widest">Active</span>}
                </div>
                <div
                  onClick={() => handleSkinSelect(skin)}
                  className={`w-16 h-16 bg-black/40 border-2 shadow-inner relative cursor-pointer overflow-hidden transition-colors outline-none ${(isActive || isFocused) ? 'border-[#FFFF55]' : 'border-[#373737] hover:border-[#A0A0A0]'}`}
                >
                  <img src={skin.url} alt={skin.name} className="absolute max-w-none" style={{ width: '800%', height: 'auto', left: '-100%', top: '-100%', imageRendering: 'pixelated' }} loading="lazy" decoding="async" />
                </div>
                <input
                  type="text" value={skin.name} maxLength={16}
                  onChange={(e) => handleNameChange(skin.id, e.target.value)}
                  className={`bg-transparent text-center outline-none border-none text-base mc-text-shadow w-full truncate transition-colors ${(isActive || isFocused) ? 'text-[#FFFF55]' : 'text-white'} ${isDefaultSkin(skin.id) ? 'pointer-events-none' : ''}`}
                  onClick={(e) => e.stopPropagation()} spellCheck={false}
                  readOnly={isDefaultSkin(skin.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <button
        data-index={BACK_BUTTON_INDEX}
        onMouseEnter={() => setFocusIndex(BACK_BUTTON_INDEX)}
        onClick={() => { playBackSound(); setActiveView('main'); }}
        className={`w-72 h-14 flex items-center justify-center transition-colors text-2xl mc-text-shadow mt-2 outline-none border-none hover:text-[#FFFF55] ${focusIndex === BACK_BUTTON_INDEX ? 'text-[#FFFF55]' : 'text-white'}`}
        style={{ backgroundImage: focusIndex === BACK_BUTTON_INDEX ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
      >
        Back
      </button>
    </motion.div>
  );
});

export default SkinsView;
