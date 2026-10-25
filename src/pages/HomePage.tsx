import React, { useState, useEffect } from 'react';
import { TvShow, Genre } from '../types';
import { publicApi, adminApi } from '../services/api';
import { HeroBanner } from '../components/HeroBanner';
import { ShowCarousel } from '../components/ShowCarousel';
import { EmptyState } from '../components/EmptyState';
import { TrailerModal } from '../components/TrailerModal';
import { Sparkles, Layers, Flame, Clock, Award } from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [featuredShow, setFeaturedShow] = useState<TvShow | null>(null);
  const [trendingShows, setTrendingShows] = useState<TvShow[]>([]);
  const [latestShows, setLatestShows] = useState<TvShow[]>([]);
  const [popularShows, setPopularShows] = useState<TvShow[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrailerId, setActiveTrailerId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [featRes, trendRes, lateRes, popRes, genreRes] = await Promise.all([
        publicApi.getShows({ featured: true, limit: 1 }),
        publicApi.getShows({ trending: true, limit: 12 }),
        publicApi.getShows({ sort: 'newest', limit: 12 }),
        publicApi.getShows({ sort: 'rating', limit: 12 }),
        publicApi.getGenres()
      ]);

      const featured = featRes.shows.length > 0 ? featRes.shows[0] : (lateRes.shows[0] || null);
      setFeaturedShow(featured);
      setTrendingShows(trendRes.shows);
      setLatestShows(lateRes.shows);
      setPopularShows(popRes.shows);
      setGenres(genreRes);
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await adminApi.seedDemo();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to seed demo data. Please check admin login.');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-400">Loading catalog...</p>
      </div>
    );
  }

  const isEmpty = !featuredShow && trendingShows.length === 0 && latestShows.length === 0;

  return (
    <div className="space-y-6 sm:space-y-10">
      {isEmpty ? (
        <div className="px-4 py-8">
          <EmptyState
            onGoToAdmin={() => onNavigate('/admin/dashboard')}
            onSeedDemo={handleSeedDemo}
            seeding={seeding}
          />
        </div>
      ) : (
        <>
          {/* Featured TV Show Hero Banner */}
          {featuredShow && (
            <HeroBanner
              show={featuredShow}
              onSelect={(slug) => onNavigate(`/tv-show/${slug}`)}
              onPlayTrailer={(id) => setActiveTrailerId(id)}
            />
          )}

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
                    {g.show_count && g.show_count > 0 ? (
                      <span className="ml-1.5 text-neutral-500 font-mono text-[10px]">({g.show_count})</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Series Carousel */}
          {trendingShows.length > 0 && (
            <ShowCarousel
              title="Trending TV Series"
              subtitle="Most watched and discussed series this week"
              shows={trendingShows}
              onSelectShow={(slug) => onNavigate(`/tv-show/${slug}`)}
              onViewAll={() => onNavigate('/shows?trending=true')}
            />
          )}

          {/* Latest Released Series Carousel */}
          {latestShows.length > 0 && (
            <ShowCarousel
              title="Latest TV Series &amp; Updates"
              subtitle="Recently added series and new seasons"
              shows={latestShows}
              onSelectShow={(slug) => onNavigate(`/tv-show/${slug}`)}
              onViewAll={() => onNavigate('/shows?sort=newest')}
            />
          )}

          {/* Top Rated Series Carousel */}
          {popularShows.length > 0 && (
            <ShowCarousel
              title="Critically Acclaimed &amp; Popular"
              subtitle="Top-rated television series ranked by IMDb scores"
              shows={popularShows}
              onSelectShow={(slug) => onNavigate(`/tv-show/${slug}`)}
              onViewAll={() => onNavigate('/shows?sort=rating')}
            />
          )}
        </>
      )}

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
