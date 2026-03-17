interface PanoramaProps {
  profile: string;
  isDay: boolean;
}

export default function PanoramaBackground({ profile, isDay }: PanoramaProps) {
  const currentPanorama = `/panorama/${profile}_Panorama_Background_${isDay ? 'Day' : 'Night'}.png`;

  return (
    <>
      <style>{`
        @keyframes panoramaLoop { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
        .animate-panorama { display: flex; width: max-content; animation: panoramaLoop 140s linear infinite; will-change: transform; }
      `}</style>
      
      <div className="absolute inset-0 flex overflow-hidden pointer-events-none transition-opacity duration-500">
        <div className="flex h-full shrink-0 animate-panorama">
          <img src={currentPanorama} className="h-full w-auto" alt="Panorama" />
          <img src={currentPanorama} className="h-full w-auto" alt="Panorama Loop" />
        </div>
      </div>
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />
    </>
  );
}
