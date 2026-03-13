import { useRef, useEffect } from "react";
import * as THREE from 'three';

interface SkinViewerProps {
  skinUrl: string | null;
}

export function SkinViewer({ skinUrl }: SkinViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 0, 70);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(width, height);
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

    img.src = skinUrl || "/images/steve.png";

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
