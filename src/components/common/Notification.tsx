import React from 'react';

interface NotificationProps {
  title: string;
  message: string;
}

export const Notification: React.FC<NotificationProps> = ({ title, message }) => {
  return (
    <div className="absolute top-6 right-6 bg-[#202020] border-2 border-black p-4 flex items-center gap-4 shadow-[5px_5px_15px_rgba(0,0,0,0.5)] z-[100] animate-in slide-in-from-right-10">
      <div className="w-12 h-12 bg-emerald-500 border-2 border-black flex items-center justify-center text-3xl font-bold">
        ✓
      </div>
      <div className="flex flex-col">
        <span className="text-[#ffff55] text-2xl font-bold">{title}</span>
        <span className="text-white text-xl">{message}</span>
      </div>
    </div>
  );
};
