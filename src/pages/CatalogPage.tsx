import React, { useState, useEffect } from 'react';
import { TvShow, Genre } from '../types';
import { publicApi } from '../services/api';
import { ShowCard } from '../components/ShowCard';
import { DEFAULT_SHOWS } from '../data/defaultCatalog';
import { Search, Filter, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CatalogPageProps {
  onNavigate: (path: string) => void;
  initialGenre?: string;
  initialSort?: string;
  initialTrending?: boolean;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  onNavigate,
  initialGenre = '',
  initialSort = 'newest',
  initialTrending = false
}) => {
  const [shows, setShows] = useState<TvShow[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    publicApi.getGenres().then(setGenres).catch(console.error);
  }, []);

  useEffect(() => {
    setSelectedGenre(initialGenre);
  }, [initialGenre]);

  useEffect(() => {
    setSelectedSort(initialSort);
  }, [initialSort]);

  const fetchShows = async () => {
    setLoading(true);
    try {
      const res = await publicApi.getShows({
        page,
        limit: 18,
        search: search.trim() || undefined,
        genre: selectedGenre || undefined,
        status: selectedStatus || undefined,
        sort: selectedSort,
        trending: initialTrending || undefined
      });
      if (res && res.shows && res.shows.length > 0) {
        setShows(res.shows);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } else {
        setShows(DEFAULT_SHOWS);
        setTotal(DEFAULT_SHOWS.length);
        setTotalPages(1);
      }
    } catch (err) {
      setShows(DEFAULT_SHOWS);
      setTotal(DEFAULT_SHOWS.length);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, [page, selectedGenre, selectedStatus, selectedSort, initialTrending]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShows();
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedGenre('');
    setSelectedStatus('');
    setSelectedSort('newest');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || selectedGenre || selectedStatus || selectedSort !== 'newest');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          TV Shows Catalog
        </h1>
        <p className="text-sm text-neutral-400">
          Browse complete television series, multi-season guides, and verified episode details.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 mb-8 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by series title, cast member, or synopsis..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-neutral-800/80">
          <div className="flex flex-wrap items-center gap-3">
            {/* Genre Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 font-medium">Genre:</span>
              <select
                value={selectedGenre}
                onChange={(e) => {
                  setSelectedGenre(e.target.value);
                  setPage(1);
                }}
                className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="">All Genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.slug}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>

            {/* Sort Order Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 font-medium">Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  setPage(1);
                }}
                className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="newest">Newest Added</option>
                <option value="rating">Highest IMDb Rating</option>
                <option value="popular">Most Popular</option>
                <option value="year">Release Year</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Active Filter Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-6">
        <span>
          Showing <strong className="text-neutral-200 font-mono">{shows.length}</strong> of <strong className="text-neutral-200 font-mono">{total}</strong> series
        </span>
        {totalPages > 1 && (
          <span>
            Page <strong className="text-neutral-200 font-mono">{page}</strong> of <strong className="text-neutral-200 font-mono">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Shows Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-7 h-7 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500">Searching database...</p>
        </div>
      ) : shows.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {shows.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              onSelect={(slug) => onNavigate(`/tv-show/${slug}`)}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-xl bg-neutral-900/30 border border-neutral-800">
          <p className="text-sm text-neutral-400 mb-3">No TV shows match your specified filters.</p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-xs font-semibold text-rose-500 hover:text-rose-400 bg-neutral-900 rounded-lg border border-neutral-800 cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-300 border border-neutral-800 cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              return (
                <React.Fragment key={p}>
                  {prev && p - prev > 1 && (
                    <span className="px-2 text-neutral-600 text-xs font-mono">...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                      page === p
                        ? 'bg-rose-600 text-white'
                        : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-300 border border-neutral-800 cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
