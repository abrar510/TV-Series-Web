import React, { useState, useEffect } from 'react';
import { Genre } from '../types';
import { publicApi } from '../services/api';
import { Layers, ArrowRight } from 'lucide-react';

interface GenresPageProps {
  onSelectGenre: (genreSlug: string) => void;
}

export const GenresPage: React.FC<GenresPageProps> = ({ onSelectGenre }) => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.getGenres()
      .then(setGenres)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          Explore TV Series by Genre
        </h1>
        <p className="text-sm text-neutral-400">
          Discover television drama, hard sci-fi epics, psychological thrillers, and crime sagas categorized by curated themes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {genres.map((genre) => (
          <div
            key={genre.id}
            onClick={() => onSelectGenre(genre.slug)}
            className="group p-6 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-rose-600/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
                {genre.name}
              </h3>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                {genre.description || 'Explore trending series and episodes in this genre.'}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 font-medium">
              <span className="font-mono">{genre.show_count || 0} Series</span>
              <span className="text-rose-500 group-hover:text-rose-400 flex items-center gap-1 transition-colors">
                Browse <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
