import React from 'react';
import { Play, Info, Star } from 'lucide-react';
import { TvShow } from '../types';

interface HeroBannerProps {
  show: TvShow;
  onSelect: (slug: string) => void;
  onPlayTrailer?: (youtubeId: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ show, onSelect, onPlayTrailer }) => {
  return (
    <div className="relative w-full h-[520px] sm:h-[600px] lg:h-[680px] overflow-hidden bg-neutral-950">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0">
        {show.backdrop_url ? (
          <img
            src={show.backdrop_url}
            alt={show.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900" />
        )}
        {/* Cinematic Gradient Scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent w-full md:w-3/4" />
      </div>

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16 sm:pb-20 z-10">
        <div className="max-w-2xl space-y-4">
          
          {/* Metadata Bar (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-neutral-300">
            {show.imdb_rating > 0 && (
              <span className="flex items-center gap-1 font-mono font-semibold text-amber-400">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{show.imdb_rating.toFixed(1)} IMDb</span>
              </span>
            )}
            <span aria-hidden="true" className="text-neutral-500">·</span>
            <span>{show.release_year}</span>
            <span aria-hidden="true" className="text-neutral-500">·</span>
            <span>{show.seasons_count} {show.seasons_count === 1 ? 'Season' : 'Seasons'}</span>
            {show.status && (
              <>
                <span aria-hidden="true" className="text-neutral-500">·</span>
                <span className="text-rose-400">{show.status}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase drop-shadow-md text-balance">
            {show.title}
          </h1>

          {/* Overview text */}
          <p className="text-sm sm:text-base text-neutral-300 line-clamp-3 leading-relaxed drop-shadow">
            {show.overview}
          </p>

          {/* Genres as clean editorial text */}
          {show.genres && show.genres.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="text-neutral-500">Genres:</span>
              <span>{show.genres.map(g => g.name).join(' · ')}</span>
            </div>
          )}

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            {show.youtube_trailer_id && onPlayTrailer && (
              <button
                onClick={() => onPlayTrailer(show.youtube_trailer_id!)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-rose-900/30 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Official Trailer</span>
              </button>
            )}

            <button
              onClick={() => onSelect(show.slug)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-white border border-neutral-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>Series Details &amp; Episodes</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
