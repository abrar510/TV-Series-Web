import React, { useState, useEffect } from 'react';
import { TvShow, Season, Episode } from '../types';
import { publicApi } from '../services/api';
import { TrailerModal } from '../components/TrailerModal';
import { ShowCard } from '../components/ShowCard';
import {
  Star,
  Play,
  Share2,
  Calendar,
  Clock,
  Film,
  Check,
  ChevronRight,
  ExternalLink,
  Download,
  Tv,
  Globe
} from 'lucide-react';

interface ShowDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ShowDetailPage: React.FC<ShowDetailPageProps> = ({ slug, onNavigate }) => {
  const [show, setShow] = useState<TvShow | null>(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTrailerId, setActiveTrailerId] = useState<string | null>(null);
  const [activeEpisodeVideo, setActiveEpisodeVideo] = useState<{ title: string; url: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    publicApi.getShowBySlug(slug)
      .then((data) => {
        if (!isMounted) return;
        setShow(data);
        if (data.seasons && data.seasons.length > 0) {
          setSelectedSeasonNumber(data.seasons[0].season_number);
        }

        // Update document title for SEO
        document.title = `${data.seo_title || data.title} - Spectra TV`;
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'TV Show not found');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareTwitter = () => {
    if (!show) return;
    const text = encodeURIComponent(`Explore "${show.title}" on Spectra TV!`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-400">Loading series details...</p>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 text-center rounded-2xl bg-neutral-900 border border-neutral-800">
        <Film className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Series Not Found (404)</h2>
        <p className="text-sm text-neutral-400 mb-6">
          The requested TV series slug does not exist or has not been published yet.
        </p>
        <button
          onClick={() => onNavigate('/shows')}
          className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
        >
          Return to Series Catalog
        </button>
      </div>
    );
  }

  const activeSeason = show.seasons?.find((s) => s.season_number === selectedSeasonNumber);
  const activeEpisodes = activeSeason?.episodes || [];

  // Schema.org TVSeries structured data
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: show.title,
    description: show.overview,
    genre: show.genres?.map((g) => g.name),
    numberOfSeasons: show.seasons_count,
    numberOfEpisodes: show.episodes_count,
    startDate: show.release_year.toString(),
    endDate: show.end_year ? show.end_year.toString() : undefined,
    director: show.director ? { '@type': 'Person', name: show.director } : undefined,
    creator: show.creator ? { '@type': 'Person', name: show.creator } : undefined,
    aggregateRating: show.imdb_rating > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: show.imdb_rating,
      bestRating: '10',
      ratingCount: '1000'
    } : undefined
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Schema.org JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* Backdrop Header with Scrim */}
      <div className="relative w-full h-[450px] sm:h-[550px] lg:h-[620px] bg-neutral-950 overflow-hidden">
        {show.backdrop_url ? (
          <img
            src={show.backdrop_url}
            alt={show.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top filter brightness-75"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-neutral-900 to-neutral-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/60 to-transparent w-full md:w-2/3" />
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-64 sm:-mt-80 relative z-10 space-y-12">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
          <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors cursor-pointer">
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <button onClick={() => onNavigate('/shows')} className="hover:text-white transition-colors cursor-pointer">
            TV Shows
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-neutral-200 truncate">{show.title}</span>
        </nav>

        {/* Hero Section: Poster + Show Specs */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Poster Column */}
          <div className="w-48 sm:w-64 md:w-72 shrink-0 mx-auto md:mx-0">
            <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl">
              {show.poster_url ? (
                <img
                  src={show.poster_url}
                  alt={show.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                  <Film className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Quick Trailer Button below poster */}
            {show.youtube_trailer_id && (
              <button
                onClick={() => setActiveTrailerId(show.youtube_trailer_id!)}
                className="mt-3.5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Official Trailer</span>
              </button>
            )}

            {/* Social Sharing Actions */}
            <div className="mt-4 flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400">
              <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider pl-1">Share</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 rounded hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer relative"
                  title="Copy link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleShareTwitter}
                  className="px-2 py-1 rounded hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer text-xs"
                >
                  X / Twitter
                </button>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-6">
            
            <div>
              {/* Unboxed Metadata (Zero-Pill Discipline) */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-neutral-400 font-medium mb-2">
                {show.imdb_rating > 0 && (
                  <span className="flex items-center gap-1 font-mono font-semibold text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{show.imdb_rating.toFixed(1)} IMDb</span>
                  </span>
                )}
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span>{show.release_year}{show.end_year ? `–${show.end_year}` : '–Present'}</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span>{show.seasons_count} {show.seasons_count === 1 ? 'Season' : 'Seasons'}</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span>{show.episodes_count} Episodes</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className={show.status === 'Completed' ? 'text-neutral-400' : 'text-rose-400 font-medium'}>
                  {show.status}
                </span>
              </div>

              {/* Title & Original Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {show.title}
              </h1>
              {show.original_title && show.original_title !== show.title && (
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 italic">
                  Original Title: {show.original_title}
                </p>
              )}
            </div>

            {/* Overview / Synopsis */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Overview</h3>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                {show.full_description || show.overview}
              </p>
            </div>

            {/* Series Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/80 text-xs">
              <div>
                <span className="text-neutral-500 block">Genres</span>
                <span className="text-neutral-200 font-medium mt-0.5 block">
                  {show.genres && show.genres.length > 0 ? show.genres.map(g => g.name).join(', ') : 'Drama'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block">Country</span>
                <span className="text-neutral-200 font-medium mt-0.5 block">{show.country || 'United States'}</span>
              </div>

              <div>
                <span className="text-neutral-500 block">Language</span>
                <span className="text-neutral-200 font-medium mt-0.5 block">{show.language || 'English'}</span>
              </div>

              <div>
                <span className="text-neutral-500 block">Creator</span>
                <span className="text-neutral-200 font-medium mt-0.5 block">{show.creator || 'N/A'}</span>
              </div>

              <div>
                <span className="text-neutral-500 block">Director</span>
                <span className="text-neutral-200 font-medium mt-0.5 block">{show.director || 'N/A'}</span>
              </div>

              <div>
                <span className="text-neutral-500 block">Main Cast</span>
                <span className="text-neutral-200 font-medium mt-0.5 block truncate" title={show.cast_members}>
                  {show.cast_members || 'N/A'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Seasons and Episodes Section */}
        <section className="pt-6 border-t border-neutral-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Seasons &amp; Episodes
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Select a season to browse official episode guides and playback sources.
              </p>
            </div>

            {/* Season Selector Tabs */}
            {show.seasons && show.seasons.length > 0 && (
              <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto no-scrollbar">
                {show.seasons.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeasonNumber(s.season_number)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedSeasonNumber === s.season_number
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Season {s.season_number}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Season Overview */}
          {activeSeason?.overview && (
            <p className="text-xs sm:text-sm text-neutral-400 italic">
              {activeSeason.overview}
            </p>
          )}

          {/* Episode List */}
          {activeEpisodes.length > 0 ? (
            <div className="space-y-3">
              {activeEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/80 transition-colors group"
                >
                  {/* Episode Number */}
                  <div className="w-8 text-center text-sm font-mono font-bold text-neutral-500 shrink-0">
                    {String(ep.episode_number).padStart(2, '0')}
                  </div>

                  {/* Thumbnail / Play Button */}
                  <div
                    onClick={() => ep.video_url && setActiveEpisodeVideo({ title: `${show.title} - S${ep.season_number}E${ep.episode_number}: ${ep.title}`, url: ep.video_url })}
                    className="relative w-36 sm:w-44 aspect-video rounded-lg overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800 cursor-pointer"
                  >
                    {ep.thumbnail_url || show.backdrop_url ? (
                      <img
                        src={ep.thumbnail_url || show.backdrop_url}
                        alt={ep.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-700">
                        <Film className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center">
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>

                  {/* Episode Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors">
                        {ep.title}
                      </h4>
                      {ep.runtime_minutes && (
                        <span className="text-[11px] font-mono text-neutral-500">
                          {ep.runtime_minutes}m
                        </span>
                      )}
                      {ep.release_date && (
                        <span className="text-[11px] text-neutral-500">
                          · {ep.release_date}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {ep.description || 'No episode synopsis provided.'}
                    </p>
                  </div>

                  {/* Watch / Embed Links */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {ep.video_url && (
                      <button
                        onClick={() => setActiveEpisodeVideo({ title: `${show.title} - S${ep.season_number}E${ep.episode_number}: ${ep.title}`, url: ep.video_url! })}
                        className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch</span>
                      </button>
                    )}

                    {ep.external_watch_link && (
                      <a
                        href={ep.external_watch_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        title="External Stream"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {ep.download_link && (
                      <a
                        href={ep.download_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        title="Authorized Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-neutral-900/30 border border-neutral-800 text-neutral-400 text-xs">
              No episodes have been published for this season yet.
            </div>
          )}
        </section>

        {/* Related TV Series */}
        {show.related && show.related.length > 0 && (
          <section className="pt-6 border-t border-neutral-900">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-6">
              More Series Like This
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {show.related.map((rel) => (
                <ShowCard
                  key={rel.id}
                  show={rel}
                  onSelect={(slug) => onNavigate(`/tv-show/${slug}`)}
                />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Trailer Modal */}
      {activeTrailerId && (
        <TrailerModal
          youtubeId={activeTrailerId}
          onClose={() => setActiveTrailerId(null)}
        />
      )}

      {/* Episode Video Embed Modal */}
      {activeEpisodeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/60">
              <span className="text-xs font-semibold text-neutral-200 truncate pr-4">
                {activeEpisodeVideo.title}
              </span>
              <button
                onClick={() => setActiveEpisodeVideo(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              {activeEpisodeVideo.url.includes('youtube.com') || activeEpisodeVideo.url.includes('youtu.be') ? (
                <iframe
                  src={activeEpisodeVideo.url.replace('watch?v=', 'embed/')}
                  title={activeEpisodeVideo.title}
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <iframe
                  src={activeEpisodeVideo.url}
                  title={activeEpisodeVideo.title}
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
