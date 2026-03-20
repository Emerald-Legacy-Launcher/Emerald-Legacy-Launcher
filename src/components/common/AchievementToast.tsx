import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AchievementToastProps {
  message: string | null;
  onClose: () => void;
}

export function AchievementToast({ message, onClose }: AchievementToastProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          onClick={onClose}
          className="fixed top-6 right-6 z-[9999] cursor-pointer"
        >
          <div 
            className="flex items-center gap-4 p-4 min-w-[300px] max-w-[450px]"
            style={{
              backgroundColor: "#212121",
              border: "4px solid",
              borderTopColor: "#7F7F7F",
              borderLeftColor: "#7F7F7F",
              borderBottomColor: "#3F3F3F",
              borderRightColor: "#3F3F3F",
              imageRendering: "pixelated",
            }}
          >
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-[#3F3F3F] border-2 border-[#1A1A1A]">
               <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#FF5555" 
                strokeWidth="3" 
                strokeLinecap="square"
                className="drop-shadow-md"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[#FFFF55] text-lg font-bold mc-text-shadow leading-tight">
                Error Get!
              </span>
              <span className="text-white text-base mc-text-shadow leading-tight break-words">
                {message}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
