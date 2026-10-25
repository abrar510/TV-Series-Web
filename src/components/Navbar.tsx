import React, { useState, useEffect, useRef } from 'react';
import { Search, Film, Shield, X, ArrowRight, Menu } from 'lucide-react';
import { TvShow } from '../types';
import { publicApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  siteName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, siteName = 'SPECTRA' }) => {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TvShow[]>([]);
  const [searching, setSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await publicApi.search(searchQuery);
        setSearchResults(res);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'TV Shows', path: '/shows' },
    { label: 'Genres', path: '/genres' },
    { label: 'Latest Updates', path: '/shows?sort=newest' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-md border-b border-neutral-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          
          {/* Zone 1: Single element brand wordmark */}
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left group shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded"
          >
            <div className="w-8 h-8 rounded bg-rose-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Film className="w-4 h-4" />
            </div>
            <span className="text-xl font-extrabold tracking-wider text-white uppercase whitespace-nowrap">
              {siteName}
            </span>
          </button>

          {/* Zone 2: 4-5 concise single-line text links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-300">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.label}
                  onClick={() => onNavigate(link.path)}
                  className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer relative py-1 ${
                    isActive ? 'text-white font-semibold' : 'text-neutral-400'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action / utility controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-400 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors cursor-pointer"
              title="Search TV shows"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Search...</span>
            </button>

            {user ? (
              <button
                onClick={() => onNavigate('/admin/dashboard')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/admin/login')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-neutral-500" />
                <span>Staff Portal</span>
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-400 hover:text-white cursor-pointer"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-900 bg-neutral-950 px-4 pt-3 pb-5 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  onNavigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-sm rounded-md ${
                  currentPath === link.path
                    ? 'bg-neutral-900 text-rose-500 font-semibold'
                    : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => {
                onNavigate(user ? '/admin/dashboard' : '/admin/login');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-neutral-400 hover:text-white"
            >
              {user ? 'Admin Dashboard' : 'Staff Login'}
            </button>
          </div>
        )}
      </header>

      {/* Global Interactive Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-neutral-800">
              <Search className="w-5 h-5 text-neutral-400 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search TV shows by title, genre, actor, or keyword..."
                className="w-full bg-transparent text-white placeholder-neutral-500 focus:outline-none text-base"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {searching ? (
                <div className="p-6 text-center text-sm text-neutral-400">Searching catalog...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((show) => (
                    <button
                      key={show.id}
                      onClick={() => {
                        onNavigate(`/tv-show/${show.slug}`);
                        setSearchOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-800 transition-colors text-left cursor-pointer group"
                    >
                      {show.poster_url ? (
                        <img
                          src={show.poster_url}
                          alt={show.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-14 object-cover rounded bg-neutral-950 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-14 rounded bg-neutral-950 flex items-center justify-center shrink-0 text-neutral-600">
                          <Film className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white group-hover:text-rose-400 truncate">
                          {show.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                          <span>{show.release_year}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-400 font-mono">★ {show.imdb_rating.toFixed(1)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{show.seasons_count} {show.seasons_count === 1 ? 'Season' : 'Seasons'}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="p-6 text-center text-sm text-neutral-400">
                  No TV shows found matching "{searchQuery}"
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-neutral-500">
                  Type at least 2 characters to search TV series
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
