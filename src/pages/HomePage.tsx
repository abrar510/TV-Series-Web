import React, { useState, useEffect } from 'react';
import { TvShow, Genre } from '../types';
import { publicApi, adminApi } from '../services/api';
import { HeroBanner } from '../components/HeroBanner';
import { ShowCarousel } from '../components/ShowCarousel';
import { TrailerModal } from '../components/TrailerModal';
import { DEFAULT_SHOWS, DEFAULT_GENRES } from '../data/defaultCatalog';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [featuredShow, setFeaturedShow] = useState<TvShow>(DEFAULT_SHOWS[0]);
  const [trendingShows, setTrendingShows] = useState<TvShow[]>(DEFAULT_SHOWS);
  const [latestShows, setLatestShows] = useState<TvShow[]>(DEFAULT_SHOWS);
  const [popularShows, setPopularShows] = useState<TvShow[]>(DEFAULT_SHOWS);
  const [genres, setGenres] = useState<Genre[]>(DEFAULT_GENRES);
  const [loading, setLoading] = useState(false);
  const [activeTrailerId, setActiveTrailerId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [featRes, trendRes, lateRes, popRes, genreRes] = await Promise.all([
        publicApi.getShows({ featured: true, limit: 1 }).catch(() => null),
        publicApi.getShows({ trending: true, limit: 12 }).catch(() => null),
        publicApi.getShows({ sort: 'newest', limit: 12 }).catch(() => null),
        publicApi.getShows({ sort: 'rating', limit: 12 }).catch(() => null),
        publicApi.getGenres().catch(() => null)
      ]);

      if (featRes && featRes.shows && featRes.shows.length > 0) {
        setFeaturedShow(featRes.shows[0]);
      }
      if (trendRes && trendRes.shows && trendRes.shows.length > 0) {
        setTrendingShows(trendRes.shows);
      }
      if (lateRes && lateRes.shows && lateRes.shows.length > 0) {
        setLatestShows(lateRes.shows);
      }
      if (popRes && popRes.shows && popRes.shows.length > 0) {
        setPopularShows(popRes.shows);
      }
      if (genreRes && genreRes.length > 0) {
        setGenres(genreRes);
      }
    } catch (err) {
      console.warn('API fetch fell back to default catalog');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-10 pb-16">
      {/* Featured TV Show Hero Banner */}
      <HeroBanner
        show={featuredShow}
        onSelect={(slug) => onNavigate(`/tv-show/${slug}`)}
        onPlayTrailer={(id) => setActiveTrailerId(id)}
      />

      {/* Quick Genre Filter Bar */}
      {genres.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mr-2 shrink-0">
              Genres
            </span>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => onNavigate(`/shows?genre=${g.slug}`)}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 hover:text-white border border-neutral-800 transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Series Carousel */}
      <ShowCarousel
        title="Trending TV Series"
        subtitle="Most watched and discussed series this week"
        shows={trendingShows}
        onSelectShow={(slug) => onNavigate(`/tv-show/${slug}`)}
        onViewAll={() => onNavigate('/shows?trending=true')}
      />

      {/* Latest Released Series Carousel */}
      <ShowCarousel
        title="Latest TV Series &amp; Updates"
        subtitle="Recently added series and new seasons"
        shows={latestShows}
        onSelectShow={(slug) => onNavigate(`/tv-show/${slug}`)}
        onViewAll={() => onNavigate('/shows?sort=newest')}
      />

      {/* Top Rated Series Carousel */}
      <ShowCarousel
        title="Critically Acclaimed &amp; Popular"
        subtitle="Top-rated television series ranked by IMDb scores"
        shows={popularShows}
        onSelectShow={(slug) => onNavigate(`/tv-show/${slug}`)}
        onViewAll={() => onNavigate('/shows?sort=rating')}
      />

      {/* Trailer Modal */}
      {activeTrailerId && (
        <TrailerModal
          youtubeId={activeTrailerId}
          onClose={() => setActiveTrailerId(null)}
        />
      )}
    </div>
  );
};
