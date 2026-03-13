import React from "react";

export const PanoramaBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black z-0 pointer-events-none">
      <div 
        className="absolute inset-0 w-full h-full legacy-panorama-pan blur-[6px]"
        style={{
          backgroundImage: "url('/images/TU7_Panorama_Background_S.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          imageRendering: "auto"
        }}
      />
      <div className="absolute inset-0 bg-black/20 z-10" />
    </div>
  );
};