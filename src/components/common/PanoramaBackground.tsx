import React, { useRef, useEffect } from "react";
import * as THREE from 'three';

export const PanoramaBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0); 

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(100, 100, 100);
    geometry.scale(-1, 1, 1); 

    const textureLoader = new THREE.TextureLoader();
    const materials = [
      new THREE.MeshBasicMaterial({ map: textureLoader.load('/images/panorama_1.png') }),
      new THREE.MeshBasicMaterial({ map: textureLoader.load('/images/panorama_3.png') }),
      new THREE.MeshBasicMaterial({ map: textureLoader.load('/images/panorama_4.png') }),
      new THREE.MeshBasicMaterial({ map: textureLoader.load('/images/panorama_5.png') }),
      new THREE.MeshBasicMaterial({ map: textureLoader.load('/images/panorama_0.png') }),
      new THREE.MeshBasicMaterial({ map: textureLoader.load('/images/panorama_2.png') }),
    ];

    materials.forEach(mat => {
      if (mat.map) {
        mat.map.magFilter = THREE.NearestFilter;
        mat.map.minFilter = THREE.NearestFilter;
      }
    });

    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      camera.rotation.y -= 0.0004; 
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black z-0 pointer-events-none">
      <div ref={mountRef} className="w-full h-full blur-[5px] scale-110" />
      <div className="absolute inset-0 bg-black/20 z-10" />
      <img src="/images/panorama_overlay.png" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80 z-20" />
    </div>
  );
};