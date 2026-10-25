import React, { useState } from 'react';
import { Film, Star, Play } from 'lucide-react';
import { TvShow } from '../types';

interface ShowCardProps {
  show: TvShow;
  onSelect: (slug: string) => void;
  className?: string;
}

export const ShowCard: React.FC<ShowCardProps> = ({ show, onSelect, className = '' }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={() => onSelect(show.slug)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(show.slug);
        }
      }}
      tabIndex={0}
      role="button"
      className={`group flex flex-col cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg transition-transform duration-200 hover:-translate-y-1.5 ${className}`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800/80 shadow-md group-hover:border-neutral-700 transition-colors">
        {show.poster_url && !imageError ? (
          <img
            src={show.poster_url}
            alt={show.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-neutral-800 to-neutral-950">
            <Film className="w-8 h-8 text-neutral-600 mb-2" />
            <span className="text-xs font-semibold text-neutral-300 line-clamp-2">{show.title}</span>
          </div>
        )}

        {/* Hover quick play affordance icon */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
        </div>

        {/* Minimalist Top corner subtle tags (not pills) */}
        {show.imdb_rating > 0 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[11px] font-mono font-semibold text-amber-400 flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{show.imdb_rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Title & Metadata cleanly below the poster (per requirement) */}
      <div className="mt-2.5 flex flex-col">
        <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-rose-400 transition-colors line-clamp-1">
          {show.title}
        </h3>

        {/* Clean unboxed metadata with typographic separators */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1 font-normal">
          <span>{show.release_year}</span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span>{show.seasons_count} {show.seasons_count === 1 ? 'Season' : 'Seasons'}</span>
          {show.status && (
            <>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className={show.status === 'Completed' ? 'text-neutral-400' : 'text-rose-400'}>
                {show.status}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
