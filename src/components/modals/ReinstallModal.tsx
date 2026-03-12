import React from 'react';
import { ReinstallModalData } from '../../types';

interface ReinstallModalProps {
  data: ReinstallModalData;
  onCancel: () => void;
  onConfirm: (id: string, url: string) => void;
  playSfx: (name: string, multiplier?: number) => void;
}

export const ReinstallModal: React.FC<ReinstallModalProps> = ({
  data,
  onCancel,
  onConfirm,
  playSfx,
}) => {
  return (
    <div className="absolute inset-0 bg-black/80 z-[200] flex items-center justify-center animate-in fade-in">
      <div className="bg-[#2a2a2a] border-4 border-black p-8 w-[600px] text-center shadow-[inset_4px_4px_#555,inset_-4px_-4px_#111]">
        <h3 className="text-4xl text-[#ff5555] mb-6 font-bold uppercase tracking-widest">
          Warning
        </h3>
        <p className="text-2xl mb-10 leading-relaxed text-white">
          Reinstalling will delete all data. Continue?
        </p>
        <div className="flex gap-6">
          <button
            onClick={() => {
              playSfx('back.ogg');
              onCancel();
            }}
            className="legacy-btn px-8 py-4 text-3xl w-1/2"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              playSfx('click.wav');
              onConfirm(data.id, data.url);
            }}
            className="legacy-btn px-8 py-4 text-3xl w-1/2 confirm-red-btn"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
