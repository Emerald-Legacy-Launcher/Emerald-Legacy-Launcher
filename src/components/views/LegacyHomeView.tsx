import React, { useState, useRef, useEffect } from "react";
import * as THREE from 'three';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PanoramaBackground } from "../common/PanoramaBackground";

interface LegacyHomeViewProps {
  username: string;
  selectedInstance: string;
  setSelectedInstance: (v: string) => void;
  installedStatus: Record<string, boolean>;
  isRunning: boolean;
  installingInstance: { id: string; progress: number } | null;
  fadeAndLaunch: () => void;
  playSfx: (type: string) => void;
  setActiveTab: (tab: string) => void;
}

const MENU_ITEMS = [
  { id: 'play', label: 'Play Game' },
  { id: 'versions', label: 'Versions' },
  { id: 'settings', label: 'Settings' },
  { id: 'exit', label: 'Exit Launcher' },
];

function SkinViewer({ skinUrl }: { skinUrl: string | null }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 70);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dl = new THREE.DirectionalLight(0xffffff, 0.5);
    dl.position.set(10, 20, 15);
    scene.add(dl);

    const playerGroup = new THREE.Group();
    playerGroup.position.y = -1.5;
    scene.add(playerGroup);

    const img = new Image();
    img.onload = () => {
      const isLegacy = img.height === 32;
      const texture = new THREE.Texture(img);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;

      const createFaceMaterial = (x: number, y: number, w: number, h: number) => {
        const matTex = texture.clone();
        matTex.repeat.set(w / 64, h / img.height);
        matTex.offset.set(x / 64, 1 - (y + h) / img.height);
        matTex.needsUpdate = true;
        return new THREE.MeshLambertMaterial({ map: matTex, transparent: true, alphaTest: 0.5, side: THREE.FrontSide });
      };

      const createPart = (w: number, h: number, d: number, uv: any) => {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mats = [
          createFaceMaterial(uv.left[0], uv.left[1], uv.left[2], uv.left[3]),
          createFaceMaterial(uv.right[0], uv.right[1], uv.right[2], uv.right[3]),
          createFaceMaterial(uv.top[0], uv.top[1], uv.top[2], uv.top[3]),
          createFaceMaterial(uv.bottom[0], uv.bottom[1], uv.bottom[2], uv.bottom[3]),
          createFaceMaterial(uv.front[0], uv.front[1], uv.front[2], uv.front[3]),
          createFaceMaterial(uv.back[0], uv.back[1], uv.back[2], uv.back[3])
        ];
        return new THREE.Mesh(geo, mats);
      };

      const head = createPart(8, 8, 8, { top: [8, 0, 8, 8], bottom: [16, 0, 8, 8], right: [0, 8, 8, 8], left: [16, 8, 8, 8], front: [8, 8, 8, 8], back: [24, 8, 8, 8] });
      head.position.y = 10;
      playerGroup.add(head);

      playerGroup.add(createPart(8, 12, 4, { top: [20, 16, 8, 4], bottom: [28, 16, 8, 4], right: [16, 20, 4, 12], left: [28, 20, 4, 12], front: [20, 20, 8, 12], back: [32, 20, 8, 12] }));

      const limbUv = (x: number, y: number) => ({ top: [x + 4, y, 4, 4], bottom: [x + 8, y, 4, 4], right: [x, y + 4, 4, 12], front: [x + 4, y + 4, 4, 12], left: [x + 8, y + 4, 4, 12], back: [x + 12, y + 4, 4, 12] });

      const rightArm = createPart(4, 12, 4, limbUv(40, 16)); rightArm.position.set(-6, 0, 0); playerGroup.add(rightArm);
      const leftArm = createPart(4, 12, 4, isLegacy ? limbUv(40, 16) : limbUv(32, 48)); leftArm.position.set(6, 0, 0); playerGroup.add(leftArm);
      const rightLeg = createPart(4, 12, 4, limbUv(0, 16)); rightLeg.position.set(-2, -12, 0); playerGroup.add(rightLeg);
      const leftLeg = createPart(4, 12, 4, isLegacy ? limbUv(0, 16) : limbUv(16, 48)); leftLeg.position.set(2, -12, 0); playerGroup.add(leftLeg);

      playerGroup.rotation.y = -0.3;
    };

    img.src = skinUrl || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFKUlEQVR42u2a20sUURzH97G0LKMotPuWbVlam1alaaWPpXW1zMoyrSyyIjOKMio1P1T0IIIPPeShh+pBiOihoAci8KGHkKCHyENo+76/M/vr7Mzs7O7O7GyE5wPfnNmdM2fO5/z+Z86Zc0T/o0d8/D0S1eZJiH6E9XneJ9Etybi3mHSPz/MeidV5D0T/QhI9E6X8T0n2xGSco9tJ9vTke7BfRDqH9xYTu8Y9EqX8i0m2xGScozZcAwBwcXmXb5mHAEAAO2EA2I5rmbMAAIIwALbjWgYAYDgQ2I5rGQCA4UBgO65lwgAEr/D1o3x95B1fn/jE13t/8DUoANu5lgkDiA3ydeN9vjb/xdcqAADbuZYhAKD01tW+l68bY2zB9+QnvoYBwHauZRQAZODq41wBwHauZRQAhAGwnWsZBYBg19HNAgDs51qGAkCcWj2zHk/4eivb1wQA/nMtQwEgrh040wUAwH6uZSgA7BQAwH6uZSgAxKwAAOzHtcxSAIjtAABs51qGAkCcWj2zHk/4eivb1wQA/nMtQwEgrh040wUAwH6uZSgA7BQAwH6uZSgAxKwAAOzHtcxSAIjtAABs51qGAmD1AABs51qGAoBnBgBgO9cyCgCx1QOwuQCwn2sZBYDoFgMA27mWMQCAo5sPANu5ljEAgGAA2M61DADA/wUA27mWAQAYwAD2cy2bAIAYEQCwH9cyBIAIEQCwH9cyBACiTADAf1zLCABElwmA7VzLKADEuwQA27mWMQBApBkA2M61jAEARJkBgO1cyxgAIE4ZANjOtQwBgPglAcB/rmsZAsCqEgHAf65rGQKAFSUCgP9c1zIFALEmANjOtQwBwLMSAcB2rmUMACA+GADYzrWMBAARAgC2cy0jAUBcMwCwnWsZCQACAMB2rmUkAIgKALD9//Y8LwVAXCkA2I5rmQKAWBcAbMe1TAFA3CgA2I5rmQKA+EwAsB3XMgUAYjoA2I5rmQIAYR8A2M61TAEAFwBs51qmAEBYDwDbOdcyBQDCQwCwnWuZAgC2EwBs51qmAEBcCQBs51qmAEBoDQBs51qmAMB6AMC262P20A0nSnoTKeS1Xv2Y32tV3GvN83w51zIFAHE1ALDt+pi680eI2oI29P2Jd0R2f1x+Xvj9fDkAMAR1MZs0lD8XALZdrw1O1B16u9dE9A68zS8HACYA2PZqE4v+2uBcOQDQ5QLA9moTi68JgD1wTADWbQGAbX/A4iUAcJZrGQwAdjoAsP0Bi5cAwFmuZTAAiBsGgO0PWLwEAM5yLYMBQLw3AGz7AxYvAYCzXMsAAIj0AIAxYLxYk+NaljUAVsEAGAPGizU5rmVpARDbYwAYQ8aKNTmuZekAENsMAGPIWLEmx7VMBUCsBwDjiLFiTY5rmQKAGBcAMKYYK9bkuJYpABAeA4BxxVixJse1TAEASQDgGDO2rMlxLVMAsMoEABzP2LImx7VMAcCkCQD42WPM2LImx7WMJAD2X2w5v/nZz7FmzNiyJse1zBIAjHkA+LkzhmxZk+NallJzgwCInwUAZ2LGli1rclzLUvP8yB0EAEQAQOAzJm1Zk+NallJzkwSAmAoAeB3AmLRlTY5r2fIBiG/ZAMQkAMDrAcakt8xT/x5T//gJ2v96T7kP2gE4LwBwI2ZMeoucHNcydy6A0A0AcCtmTFrn5LiWfQeYk2yLq7OesgAAAABJRU5ErkJggg==";

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        playerGroup.rotation.y += (e.clientX - previousMousePosition.x) * 0.01;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [skinUrl]);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing pointer-events-auto" />;
}

export const LegacyHomeView: React.FC<LegacyHomeViewProps> = ({
  username,
  selectedInstance,
  installedStatus,
  isRunning,
  installingInstance,
  fadeAndLaunch,
  playSfx,
  setActiveTab
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isInstalled = installedStatus[selectedInstance];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [skinUrl, setSkinUrl] = useState<string | null>(() => localStorage.getItem("legacy_skin_url"));

  const handleSkinUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setSkinUrl(url);
      localStorage.setItem("legacy_skin_url", url);
    };
    reader.readAsDataURL(file);
  };

  const handleAction = async (id: string) => {
    if (id === 'play') {
      if (!isInstalled) {
        playSfx('error');
        return;
      }
      playSfx('click');
      fadeAndLaunch();
    } else if (id === 'versions' || id === 'settings') {
      playSfx('click');
      setActiveTab(id);
    } else if (id === 'exit') {
      playSfx('click');
      try {
        const window = await getCurrentWindow();
        window.close();
      } catch (e) {
        console.error("Failed to close window");
      }
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center z-50 select-none overflow-hidden">
      <PanoramaBackground />
      <div className="w-full flex justify-center mt-4 mb-2 z-30">
        <img
          src="/images/MenuTitle.png"
          alt="Minecraft"
          className="w-full max-w-[600px] drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0px 8px 8px rgba(0,0,0,0.8))' }}
        />
      </div>

      <div className="relative z-30 flex w-full max-w-6xl flex-1 items-center justify-center gap-12">

        <div className="flex flex-col items-center justify-center w-[350px] relative">
          <div className="relative w-full h-[520px] flex flex-col items-center">
            {/* Nametag positioned absolutely above the player head - Moved 5px up */}
            <div className="absolute top-[95px] z-20 bg-black/50 px-6 py-2 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-xl">
              <span className="text-2xl text-white legacy-text-shadow tracking-widest leading-none" style={{ fontFamily: 'Minecraft, sans-serif' }}>
                {username || "Player"}
              </span>
            </div>

            <div className="w-[320px] h-[420px] mt-auto relative">
              <SkinViewer skinUrl={skinUrl} />
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleSkinUpload} accept="image/png" className="hidden" />
          <button
            onClick={() => { playSfx('click'); fileInputRef.current?.click(); }}
            onMouseEnter={() => playSfx('hover')}
            className="group relative flex items-center justify-center w-[250px] h-[48px] transition-transform duration-100 bg-[url('/images/button.png')] hover:bg-[url('/images/button_highlighted.png')] hover:scale-105 shadow-2xl bg-[length:100%_100%] bg-center bg-no-repeat"
          >
            <span className="text-[20px] tracking-wider text-[#d0d0d0] group-hover:text-white legacy-text-shadow" style={{ fontFamily: 'Minecraft, sans-serif' }}>
              Change Skin
            </span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-6 w-full max-w-[400px]">
          {MENU_ITEMS.map((item, index) => {
            const isSelected = selectedIndex === index;

            return (
              <button
                key={item.id}
                onMouseEnter={() => {
                  if (selectedIndex !== index) playSfx('hover');
                  setSelectedIndex(index);
                }}
                onClick={() => handleAction(item.id)}
                className={`relative flex items-center justify-center w-full h-[56px] transition-transform duration-100 ${isSelected
                  ? "bg-[url('/images/button_highlighted.png')] scale-110 shadow-2xl z-10"
                  : "bg-[url('/images/button.png')] scale-100 opacity-95"
                  } bg-[length:100%_100%] bg-center bg-no-repeat`}
              >
                <span
                  className={`text-[24px] tracking-wider legacy-text-shadow ${isSelected ? 'text-white' : 'text-[#d0d0d0]'}`}
                  style={{ fontFamily: 'Minecraft, sans-serif' }}
                >
                  {isRunning && item.id === 'play'
                    ? 'Launching...'
                    : !isInstalled && item.id === 'play'
                      ? 'Not Installed'
                      : item.label}
                </span>

                {installingInstance && item.id === 'play' && (
                  <div className="absolute top-full mt-3 w-[80%] max-w-[250px]">
                    <div className="mc-progress-container !h-3 !border-2">
                      <div className="mc-progress-bar !h-1.5" style={{ width: `${installingInstance.progress}%` }} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};