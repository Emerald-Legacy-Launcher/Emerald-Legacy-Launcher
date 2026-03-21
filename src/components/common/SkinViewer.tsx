import { useEffect, useRef, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { SkinViewer as Skinview3D, IdleAnimation } from 'skinview3d';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useConfig } from '../../context/LauncherContext';

interface SkinViewerProps {
  username: string;
  setUsername: (name: string) => void;
  playClickSound: () => void;
  skinUrl: string;
  setSkinUrl: (url: string) => void;
  setActiveView: (view: string) => void;
  isFocusedSection: boolean;
  onNavigateRight: () => void;
}

const SkinViewer = memo(function SkinViewer({ username, setUsername, playClickSound, skinUrl, setSkinUrl, setActiveView, isFocusedSection, onNavigateRight }: SkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Skinview3D | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const { legacyMode } = useConfig();

  const [showLayers, setShowLayers] = useLocalStorage('lce-show-layers', true);
  const showLayersRef = useRef(showLayers);

  useEffect(() => {
    showLayersRef.current = showLayers;
  }, [showLayers]);

  useEffect(() => {
    if (!canvasRef.current) return;

    viewerRef.current = new Skinview3D({
      canvas: canvasRef.current,
      width: 220,
      height: 380,
    });

    viewerRef.current.animation = new IdleAnimation();
    viewerRef.current.autoRotate = false;

    if (viewerRef.current.controls) {
      viewerRef.current.controls.enableZoom = false;
      viewerRef.current.controls.enablePan = false;
      viewerRef.current.controls.minPolarAngle = Math.PI / 2;
      viewerRef.current.controls.maxPolarAngle = Math.PI / 2;
    }

    return () => {
      viewerRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.loadSkin(skinUrl).then(() => {
        const skin = viewerRef.current?.playerObject.skin;
        if (skin) {
          [skin.body, skin.rightArm, skin.leftArm, skin.rightLeg, skin.leftLeg, skin.head].forEach(part => {
            if (part && part.outerLayer) part.outerLayer.visible = showLayersRef.current;
          });
        }
      }).catch(console.error);
    }
  }, [skinUrl]);

  useEffect(() => {
    if (viewerRef.current) {
      const skin = viewerRef.current.playerObject?.skin;
      if (skin) {
        [skin.body, skin.rightArm, skin.leftArm, skin.rightLeg, skin.leftLeg, skin.head].forEach(part => {
          if (part && part.outerLayer) part.outerLayer.visible = showLayers;
        });
      }
    }
  }, [showLayers]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (viewerRef.current && viewerRef.current.animation) {
        viewerRef.current.animation.paused = document.hidden;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isFocusedSection) {
      setFocusIndex(legacyMode ? 1 : 0);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' && e.key !== 'ArrowDown' && e.key !== 'ArrowRight') return;

      if (e.key === 'ArrowRight') {
        if (legacyMode) onNavigateRight();
        else if (focusIndex === 3) onNavigateRight();
        else if (focusIndex === 1 || focusIndex === 2) setFocusIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft') {
        if (legacyMode) return;
        if (focusIndex === 2 || focusIndex === 3) setFocusIndex(prev => prev - 1);
      } else if (e.key === 'ArrowDown') {
        if (legacyMode) {
          return;
        } else {
          setFocusIndex(prev => (prev < 3 ? prev + 1 : prev));
        }
      } else if (e.key === 'ArrowUp') {
        if (legacyMode) {
          return;
        } else {
          setFocusIndex(prev => (prev > 0 ? prev - 1 : prev));
        }
      } else if (e.key === 'Enter') {
        if (focusIndex === 0) {
          (containerRef.current?.querySelector('input') as HTMLElement)?.focus();
        } else if (focusIndex === 1) {
          playClickSound();
          setActiveView('skins');
        } else if (focusIndex === 2) {
          playClickSound();
          setShowLayers(!showLayers);
        } else if (focusIndex === 3) {
          playClickSound();
          setSkinUrl('/images/Default.png');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusedSection, focusIndex, onNavigateRight, playClickSound, setActiveView, setShowLayers, showLayers, setSkinUrl]);

  useEffect(() => {
    if (isFocusedSection) {
      const el = containerRef.current?.querySelector(`[data-focus="${focusIndex}"]`) as HTMLElement;
      if (el && document.activeElement?.tagName !== 'INPUT') el.focus();
    }
  }, [isFocusedSection, focusIndex]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className={`absolute ${legacyMode ? 'left-[calc(50vw-340px)]' : 'left-16'} ${legacyMode ? 'top-1/2' : 'top-[42%]'} -translate-y-1/2 flex flex-col items-center gap-1 outline-none z-10`}
    >
      {!legacyMode && (
        <div className={`bg-black/20 flex justify-center items-center ${legacyMode ? 'mb-0' : 'mb-2'} px-2 py-1 rounded-sm border-2 transition-colors ${isFocusedSection && focusIndex === 0 ? 'border-[#FFFF55]' : 'border-transparent'}`} data-focus="0" tabIndex={0}>
          <input
            type="text" value={username} maxLength={16}
            style={{ width: `${Math.max(username.length, 3) + 2}ch` }}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.currentTarget.blur();
                e.stopPropagation();
              }
            }}
            className="bg-transparent text-white focus:text-[#FFFF55] outline-none border-none text-center font-['Mojangles'] mc-text-shadow tracking-widest text-xl cursor-default"
          />
        </div>
      )}
      {!legacyMode && (
        <canvas ref={canvasRef} className="drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)] cursor-ew-resize outline-none" />
      )}
      <div className={`flex ${legacyMode ? 'flex-col gap-2 mt-0' : 'flex-row gap-4 mt-2'} items-center`}>
        <button
          data-focus="1" tabIndex={0}
          onMouseEnter={() => isFocusedSection && setFocusIndex(1)}
          onClick={() => { playClickSound(); setActiveView('skins'); }}
          className={`mc-sq-btn w-12 h-12 flex items-center justify-center outline-none border-none transition-all ${isFocusedSection && focusIndex === 1 ? 'scale-110' : ''}`}
          style={isFocusedSection && focusIndex === 1 ? { backgroundImage: "url('/images/Button_Square_Highlighted.png')" } : {}}
          title="Change Skin"
        >
          <img src="/images/Change_Skin_Icon.png" alt="Skin" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
        </button>
        {!legacyMode && (
          <button
            data-focus="2" tabIndex={0}
            onMouseEnter={() => isFocusedSection && setFocusIndex(2)}
            onClick={() => { playClickSound(); setShowLayers(!showLayers); }}
            className={`mc-sq-btn w-12 h-12 flex items-center justify-center outline-none border-none transition-all ${isFocusedSection && focusIndex === 2 ? 'scale-110' : ''}`}
            style={isFocusedSection && focusIndex === 2 ? { backgroundImage: "url('/images/Button_Square_Highlighted.png')" } : {}}
            title="Toggle Layers"
          >
            <img src="/images/Layer_Icon.png" alt="Layers" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
          </button>
        )}
        {!legacyMode && (
          <button
            data-focus="3" tabIndex={0}
            onMouseEnter={() => isFocusedSection && setFocusIndex(3)}
            onClick={() => { playClickSound(); setSkinUrl('/images/Default.png'); }}
            className={`mc-sq-btn w-12 h-12 flex items-center justify-center outline-none border-none transition-all ${isFocusedSection && focusIndex === 3 ? 'scale-110' : ''}`}
            style={isFocusedSection && focusIndex === 3 ? { backgroundImage: "url('/images/Button_Square_Highlighted.png')" } : {}}
            title="Reset to Default"
          >
            <img src="/images/Trash_Bin_Icon.png" alt="Delete" className="w-8 h-8 object-contain brightness-200" style={{ imageRendering: 'pixelated' }} />
          </button>
        )}
      </div>
    </motion.div>
  );
});

export default SkinViewer;