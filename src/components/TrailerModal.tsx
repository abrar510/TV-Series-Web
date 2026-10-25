import React from 'react';
import { X } from 'lucide-react';

interface TrailerModalProps {
  youtubeId: string;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ youtubeId, onClose }) => {
  if (!youtubeId) return null;

  // Clean youtube ID if someone passed full url
  let cleanId = youtubeId;
  if (cleanId.includes('v=')) {
    cleanId = cleanId.split('v=')[1].split('&')[0];
  } else if (cleanId.includes('youtu.be/')) {
    cleanId = cleanId.split('youtu.be/')[1].split('?')[0];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Official Trailer
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Frame */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${cleanId}?autoplay=1&rel=0`}
            title="TV Show Trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
