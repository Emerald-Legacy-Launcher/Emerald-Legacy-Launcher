import { useEffect, useRef } from 'react';
import { SkinViewer as Skinview3D, IdleAnimation } from 'skinview3d';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface SkinViewerProps {
  username: string;
  setUsername: (name: string) => void;
  playClickSound: () => void;
  skinUrl: string;
  setSkinUrl: (url: string) => void;
  setActiveView: (view: string) => void;
}

export default function SkinViewer({ username, setUsername, playClickSound, skinUrl, setSkinUrl, setActiveView }: SkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Skinview3D | null>(null);
  
  const [showLayers, setShowLayers] = useLocalStorage('lce-show-layers', true);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    viewerRef.current = new Skinview3D({
      canvas: canvasRef.current,
      width: 220,
      height: 380,
      skin: skinUrl,
      alpha: true
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
                  if (part && part.outerLayer) part.outerLayer.visible = showLayers;
              });
          }
      });
    }
  }, [skinUrl, showLayers]);

  return (
    <div className="absolute left-16 top-[42%] -translate-y-1/2 flex flex-col items-center gap-1">
      <div className="bg-black/20 flex justify-center items-center mb-2 px-2 py-1 rounded-sm">
        <input 
          type="text" value={username} maxLength={16}
          style={{ width: `${Math.max(username.length, 3) + 2}ch` }}
          onChange={(e) => setUsername(e.target.value)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
              e.stopPropagation();
            }
          }}
          className="bg-transparent text-white focus:text-[#FFFF55] outline-none border-none text-center font-['Mojangles'] mc-text-shadow tracking-widest text-xl" 
        />
      </div>
      <canvas ref={canvasRef} className="drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)] cursor-ew-resize outline-none" />
      <div className="flex gap-4 mt-2 items-center">
        <button onClick={() => { playClickSound(); setActiveView('skins'); }} className="mc-sq-btn w-12 h-12 flex items-center justify-center outline-none border-none" title="Change Skin">
          <img src="/images/Change_Skin_Icon.png" alt="Skin" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
        </button>
        <button onClick={() => { playClickSound(); setShowLayers(!showLayers); }} className="mc-sq-btn w-12 h-12 flex items-center justify-center outline-none border-none" title="Toggle Layers">
            <img src="/images/Layer_Icon.png" alt="Layers" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
        </button>
        <button onClick={() => { playClickSound(); setSkinUrl('/images/Default.png'); }} className="mc-sq-btn w-12 h-12 flex items-center justify-center outline-none border-none" title="Reset to Default">
          <img src="/images/Trash_Bin_Icon.png" alt="Delete" className="w-8 h-8 object-contain brightness-200" style={{ imageRendering: 'pixelated' }} />
        </button>
      </div>
    </div>
  );
}
