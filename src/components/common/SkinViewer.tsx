import { useEffect, useRef, useState, memo } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
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
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const { legacyMode } = useConfig();

  const [showLayers, setShowLayers] = useLocalStorage('lce-show-layers', true);
  const overlaysRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = 220;
    const height = 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 0, 70);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dl = new THREE.DirectionalLight(0xffffff, 0.5);
    dl.position.set(10, 20, 15);
    scene.add(dl);

    const playerGroup = new THREE.Group();
    playerGroup.position.y = -1.5;
    scene.add(playerGroup);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(skinUrl || "/images/Default.png", (texture) => {
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.colorSpace = THREE.SRGBColorSpace;

      const img = texture.image;
      const isLegacy = img.height === 32;

      const createFaceMaterial = (x: number, y: number, w: number, h: number) => {
        const matTex = texture.clone();
        matTex.repeat.set(w / 64, h / img.height);
        matTex.offset.set(x / 64, 1 - (y + h) / img.height);
        matTex.needsUpdate = true;
        return new THREE.MeshLambertMaterial({ map: matTex, transparent: true, alphaTest: 0.5, side: THREE.FrontSide });
      };

      const createPart = (w: number, h: number, d: number, uv: any, overlayUv?: any) => {
        const group = new THREE.Group();
        const geo = new THREE.BoxGeometry(w, h, d);
        const mats = [
          createFaceMaterial(uv.right[0], uv.right[1], uv.right[2], uv.right[3]),
          createFaceMaterial(uv.left[0], uv.left[1], uv.left[2], uv.left[3]),
          createFaceMaterial(uv.top[0], uv.top[1], uv.top[2], uv.top[3]),
          createFaceMaterial(uv.bottom[0], uv.bottom[1], uv.bottom[2], uv.bottom[3]),
          createFaceMaterial(uv.front[0], uv.front[1], uv.front[2], uv.front[3]),
          createFaceMaterial(uv.back[0], uv.back[1], uv.back[2], uv.back[3])
        ];
        const mesh = new THREE.Mesh(geo, mats);
        group.add(mesh);

        if (overlayUv) {
          const oGeo = new THREE.BoxGeometry(w + 0.5, h + 0.5, d + 0.5);
          const oMats = [
            createFaceMaterial(overlayUv.right[0], overlayUv.right[1], overlayUv.right[2], overlayUv.right[3]),
            createFaceMaterial(overlayUv.left[0], overlayUv.left[1], overlayUv.left[2], overlayUv.left[3]),
            createFaceMaterial(overlayUv.top[0], overlayUv.top[1], overlayUv.top[2], overlayUv.top[3]),
            createFaceMaterial(overlayUv.bottom[0], overlayUv.bottom[1], overlayUv.bottom[2], overlayUv.bottom[3]),
            createFaceMaterial(overlayUv.front[0], overlayUv.front[1], overlayUv.front[2], overlayUv.front[3]),
            createFaceMaterial(overlayUv.back[0], overlayUv.back[1], overlayUv.back[2], overlayUv.back[3])
          ];
          const oMesh = new THREE.Mesh(oGeo, oMats);
          oMesh.visible = showLayers;
          overlaysRef.current.push(oMesh);
          group.add(oMesh);
        }
        return group;
      };

      const limbUv = (x: number, y: number) => ({
        top: [x + 4, y, 4, 4], bottom: [x + 8, y, 4, 4],
        right: [x, y + 4, 4, 12], front: [x + 4, y + 4, 4, 12],
        left: [x + 8, y + 4, 4, 12], back: [x + 12, y + 4, 4, 12]
      });

      const headUv = { top: [8, 0, 8, 8], bottom: [16, 0, 8, 8], right: [0, 8, 8, 8], left: [16, 8, 8, 8], front: [8, 8, 8, 8], back: [24, 8, 8, 8] };
      const hatUv = { top: [40, 0, 8, 8], bottom: [48, 0, 8, 8], right: [32, 8, 8, 8], left: [48, 8, 8, 8], front: [40, 8, 8, 8], back: [56, 8, 8, 8] };
      const head = createPart(8, 8, 8, headUv, hatUv);
      head.position.y = 10;
      playerGroup.add(head);

      const bodyUv = { top: [20, 16, 8, 4], bottom: [28, 16, 8, 4], right: [16, 20, 4, 12], left: [28, 20, 4, 12], front: [20, 20, 8, 12], back: [32, 20, 8, 12] };
      const jacketUv = { top: [20, 32, 8, 4], bottom: [28, 32, 8, 4], right: [16, 36, 4, 12], left: [28, 36, 4, 12], front: [20, 36, 8, 12], back: [32, 36, 8, 12] };
      playerGroup.add(createPart(8, 12, 4, bodyUv, isLegacy ? undefined : jacketUv));

      const rightArm = createPart(4, 12, 4, limbUv(40, 16), isLegacy ? undefined : limbUv(40, 32));
      rightArm.position.set(-6, 0, 0);
      playerGroup.add(rightArm);

      const leftArm = createPart(4, 12, 4, isLegacy ? limbUv(40, 16) : limbUv(32, 48), isLegacy ? undefined : limbUv(48, 48));
      leftArm.position.set(6, 0, 0);
      playerGroup.add(leftArm);

      const rightLeg = createPart(4, 12, 4, limbUv(0, 16), isLegacy ? undefined : limbUv(0, 32));
      rightLeg.position.set(-2, -12, 0);
      playerGroup.add(rightLeg);

      const leftLeg = createPart(4, 12, 4, isLegacy ? limbUv(0, 16) : limbUv(16, 48), isLegacy ? undefined : limbUv(0, 48));
      leftLeg.position.set(2, -12, 0);
      playerGroup.add(leftLeg);

      playerGroup.rotation.y = -0.3;
    });

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

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [skinUrl]);

  useEffect(() => {
    overlaysRef.current.forEach(overlay => {
      overlay.visible = showLayers;
    });
  }, [showLayers]);

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
  }, [isFocusedSection, focusIndex, onNavigateRight, playClickSound, setActiveView, setShowLayers, showLayers, setSkinUrl, legacyMode]);

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
        <div ref={mountRef} className="drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)] cursor-ew-resize outline-none w-[220px] h-[380px]" />
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