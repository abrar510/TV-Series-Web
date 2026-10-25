import React, { useState, useEffect } from 'react';
import { TvShow, Genre } from '../../types';
import { adminApi } from '../../services/api';
import {
  Save,
  ArrowLeft,
  Upload,
  Film,
  Star,
  Check,
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react';

interface AdminShowEditorProps {
  showId?: string | null;
  onBack: () => void;
  onSaved: (id: string, slug: string) => void;
}

export const AdminShowEditor: React.FC<AdminShowEditorProps> = ({ showId, onBack, onSaved }) => {
  const isEditing = Boolean(showId);

  const [genresList, setGenresList] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear());
  const [endYear, setEndYear] = useState<string>('');
  const [status, setStatus] = useState<'Ongoing' | 'Completed' | 'Upcoming'>('Ongoing');
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [country, setCountry] = useState('United States');
  const [language, setLanguage] = useState('English');
  const [imdbRating, setImdbRating] = useState('8.5');
  const [castMembers, setCastMembers] = useState('');
  const [director, setDirector] = useState('');
  const [creator, setCreator] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [youtubeTrailerId, setYoutubeTrailerId] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoMetaDescription, setSeoMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // Auto slugify when title changes if creating
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isEditing && (!slug || slug === title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'))) {
      const generated = newTitle
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  useEffect(() => {
    adminApi.getGenres().then(setGenresList).catch(console.error);

    if (isEditing && showId) {
      setLoading(true);
      adminApi.getShowById(showId)
        .then((s) => {
          setTitle(s.title);
          setSlug(s.slug);
          setOriginalTitle(s.original_title || '');
          setOverview(s.overview || '');
          setFullDescription(s.full_description || '');
          setReleaseYear(s.release_year);
          setEndYear(s.end_year ? String(s.end_year) : '');
          setStatus(s.status || 'Ongoing');
          setCountry(s.country || 'United States');
          setLanguage(s.language || 'English');
          setImdbRating(String(s.imdb_rating));
          setCastMembers(s.cast_members || '');
          setDirector(s.director || '');
          setCreator(s.creator || '');
          setPosterUrl(s.poster_url || '');
          setBackdropUrl(s.backdrop_url || '');
          setYoutubeTrailerId(s.youtube_trailer_id || '');
          setSeoTitle(s.seo_title || '');
          setSeoMetaDescription(s.seo_meta_description || '');
          setKeywords(s.keywords || '');
          setIsFeatured(Boolean(s.is_featured));
          setIsTrending(Boolean(s.is_trending));
          setIsPublished(Boolean(s.is_published));
          if (s.genres) {
            setSelectedGenreIds(s.genres.map((g) => g.id));
          }
        })
        .catch((err) => setError(err.message || 'Failed to load show'))
        .finally(() => setLoading(false));
    }
  }, [showId, isEditing]);

  const toggleGenre = (genreId: string) => {
    if (selectedGenreIds.includes(genreId)) {
      setSelectedGenreIds(selectedGenreIds.filter((id) => id !== genreId));
    } else {
      setSelectedGenreIds([...selectedGenreIds, genreId]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'poster' | 'backdrop') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File exceeds 5MB limit. Please select a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (target === 'poster') {
        setPosterUrl(base64);
      } else {
        setBackdropUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (publishState: boolean) => {
    setError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setError('Series title is required.');
      return;
    }

    setSaving(true);
    const payload = {
      title,
      slug: slug.trim(),
      original_title: originalTitle.trim() || title.trim(),
      overview,
      full_description: fullDescription || overview,
      release_year: releaseYear,
      end_year: endYear ? parseInt(endYear) : null,
      status,
      country,
      language,
      imdb_rating: parseFloat(imdbRating) || 0.0,
      cast_members: castMembers,
      director,
      creator,
      poster_url: posterUrl,
      backdrop_url: backdropUrl,
      youtube_trailer_id: youtubeTrailerId.trim(),
      seo_title: seoTitle || title,
      seo_meta_description: seoMetaDescription || overview,
      keywords,
      is_featured: isFeatured ? 1 : 0,
      is_trending: isTrending ? 1 : 0,
      is_published: publishState ? 1 : 0,
      genre_ids: selectedGenreIds
    };

    try {
      if (isEditing && showId) {
        const res = await adminApi.updateShow(showId, payload);
        setSuccessMsg('Series successfully updated.');
        onSaved(showId, res.slug);
      } else {
        const res = await adminApi.createShow(payload);
        setSuccessMsg('New series created successfully.');
        onSaved(res.id, res.slug);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save series');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All TV Shows</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded-lg border border-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : isEditing ? 'Update & Publish' : 'Publish Series'}</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {isEditing ? `Edit Series: ${title || 'TV Show'}` : 'Add New TV Show'}
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Specify series overview, release parameters, official trailer, and Cloudflare D1 storage records.
        </p>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-2.5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Form Sections */}
      <div className="space-y-6">
        
        {/* Section 1: Basic Information */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
            1. Core Series Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Series Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Breaking Bad"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="text-xs text-neutral-500 bg-neutral-950 border border-r-0 border-neutral-800 rounded-l-lg px-2.5 py-2">
                  /tv-show/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="breaking-bad"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-r-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Original Title</label>
              <input
                type="text"
                value={originalTitle}
                onChange={(e) => setOriginalTitle(e.target.value)}
                placeholder="Original language title if different"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Series Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Short Overview (Logline)</label>
            <textarea
              rows={2}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Concise 1-2 sentence hook displayed on card previews..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Full Description</label>
            <textarea
              rows={4}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Comprehensive series storyline and synopsis displayed on show page..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Section 2: Media & Images */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
            2. Posters, Backdrops &amp; Video Embed
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Poster Upload / URL */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-300">
                Poster Image URL (3:4 ratio)
              </label>
              <input
                type="text"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://... or /src/assets/images/... or uploaded image"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Local File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'poster')}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-neutral-500">Max 5MB</span>
              </div>
              {posterUrl && (
                <div className="w-24 aspect-[3/4] rounded-lg overflow-hidden border border-neutral-800 mt-2 bg-neutral-950">
                  <img src={posterUrl} alt="Poster preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Backdrop Upload / URL */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-300">
                Backdrop Image URL (16:9 ratio)
              </label>
              <input
                type="text"
                value={backdropUrl}
                onChange={(e) => setBackdropUrl(e.target.value)}
                placeholder="https://... or /src/assets/images/... or uploaded image"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Local File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'backdrop')}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-neutral-500">Max 5MB</span>
              </div>
              {backdropUrl && (
                <div className="w-40 aspect-video rounded-lg overflow-hidden border border-neutral-800 mt-2 bg-neutral-950">
                  <img src={backdropUrl} alt="Backdrop preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              YouTube Trailer Video ID or Full URL
            </label>
            <input
              type="text"
              value={youtubeTrailerId}
              onChange={(e) => setYoutubeTrailerId(e.target.value)}
              placeholder="e.g. HhesaQXLuRY or https://www.youtube.com/watch?v=HhesaQXLuRY"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>
        </div>

        {/* Section 3: Genres & Production Details */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
            3. Genres &amp; Production Details
          </h2>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Select Genres (Multi-select)
            </label>
            <div className="flex flex-wrap gap-2">
              {genresList.map((g) => {
                const isSelected = selectedGenreIds.includes(g.id);
                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Release Year</label>
              <input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(parseInt(e.target.value) || 2024)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">End Year (Optional)</label>
              <input
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                placeholder="Leave blank if ongoing"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">IMDb Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={imdbRating}
                onChange={(e) => setImdbRating(e.target.value)}
                placeholder="e.g. 8.8"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United States"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Creator</label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="Creator names"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Director</label>
              <input
                type="text"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder="Director names"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Cast Members</label>
              <input
                type="text"
                value={castMembers}
                onChange={(e) => setCastMembers(e.target.value)}
                placeholder="Comma-separated cast"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: SEO Metadata */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
            4. SEO &amp; Social Meta Tags
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Custom SEO Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Defaults to series title"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Search Keywords</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="drama, thriller, crime, detective"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">SEO Meta Description</label>
            <textarea
              rows={2}
              value={seoMetaDescription}
              onChange={(e) => setSeoMetaDescription(e.target.value)}
              placeholder="Recommended 120-160 characters for search snippets..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Section 5: Publication Flags */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
            5. Placement &amp; Visibility Toggles
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-3 bg-neutral-950 rounded-lg border border-neutral-800 cursor-pointer hover:border-neutral-700">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded"
              />
              <div>
                <span className="text-xs font-semibold text-white block">Published</span>
                <span className="text-[11px] text-neutral-500">Live on public catalog</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-neutral-950 rounded-lg border border-neutral-800 cursor-pointer hover:border-neutral-700">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded"
              />
              <div>
                <span className="text-xs font-semibold text-white block">Featured Hero Banner</span>
                <span className="text-[11px] text-neutral-500">Show on homepage banner</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-neutral-950 rounded-lg border border-neutral-800 cursor-pointer hover:border-neutral-700">
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded"
              />
              <div>
                <span className="text-xs font-semibold text-white block">Trending Spotlight</span>
                <span className="text-[11px] text-neutral-500">Feature in trending carousel</span>
              </div>
            </label>
          </div>
        </div>

      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded-lg border border-neutral-800 cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => handleSubmit(isPublished)}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Persisting changes...' : isEditing ? 'Save Series Changes' : 'Create & Publish Series'}</span>
        </button>
      </div>

    </div>
  );
};
