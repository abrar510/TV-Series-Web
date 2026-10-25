import React, { useState, useEffect } from 'react';
import { TvShow, Season, Episode } from '../../types';
import { adminApi } from '../../services/api';
import {
  FolderTree,
  PlusCircle,
  PlaySquare,
  Edit2,
  Trash2,
  Save,
  Check,
  AlertCircle,
  Film,
  Clock,
  ExternalLink,
  ChevronRight,
  Eye
} from 'lucide-react';

export const AdminSeasonsEpisodes: React.FC = () => {
  const [shows, setShows] = useState<TvShow[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>('');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  // Season Modal / Form
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [seasonForm, setSeasonForm] = useState({
    season_number: 1,
    title: '',
    overview: '',
    release_date: '',
    is_published: true
  });

  // Episode Modal / Form
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [episodeForm, setEpisodeForm] = useState({
    episode_number: 1,
    title: '',
    description: '',
    thumbnail_url: '',
    release_date: '',
    runtime_minutes: 45,
    video_source_type: 'embed',
    video_url: '',
    external_watch_link: '',
    download_link: '',
    is_published: true
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load shows on start
  useEffect(() => {
    adminApi.getShows({ limit: 100 })
      .then((res) => {
        setShows(res.shows);
        if (res.shows.length > 0) {
          setSelectedShowId(res.shows[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // When selectedShowId changes, load seasons
  useEffect(() => {
    if (!selectedShowId) {
      setSeasons([]);
      setSelectedSeasonId('');
      return;
    }

    adminApi.getSeasonsForShow(selectedShowId)
      .then((data) => {
        setSeasons(data);
        if (data.length > 0) {
          setSelectedSeasonId(data[0].id);
        } else {
          setSelectedSeasonId('');
          setEpisodes([]);
        }
      })
      .catch(console.error);
  }, [selectedShowId]);

  // When selectedSeasonId changes, load episodes
  useEffect(() => {
    if (!selectedSeasonId) {
      setEpisodes([]);
      return;
    }

    adminApi.getEpisodesForSeason(selectedSeasonId)
      .then(setEpisodes)
      .catch(console.error);
  }, [selectedSeasonId]);

  // --- Season Actions ---
  const handleOpenAddSeason = () => {
    setEditingSeason(null);
    const nextNum = seasons.length > 0 ? Math.max(...seasons.map((s) => s.season_number)) + 1 : 1;
    setSeasonForm({
      season_number: nextNum,
      title: `Season ${nextNum}`,
      overview: '',
      release_date: '',
      is_published: true
    });
    setError(null);
    setShowSeasonModal(true);
  };

  const handleOpenEditSeason = (s: Season) => {
    setEditingSeason(s);
    setSeasonForm({
      season_number: s.season_number,
      title: s.title,
      overview: s.overview || '',
      release_date: s.release_date || '',
      is_published: Boolean(s.is_published)
    });
    setError(null);
    setShowSeasonModal(true);
  };

  const handleSaveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShowId) return;
    setSaving(true);
    setError(null);

    try {
      if (editingSeason) {
        await adminApi.updateSeason(editingSeason.id, {
          ...seasonForm,
          tv_show_id: selectedShowId
        });
      } else {
        await adminApi.createSeason({
          ...seasonForm,
          tv_show_id: selectedShowId
        });
      }

      // Reload seasons
      const updated = await adminApi.getSeasonsForShow(selectedShowId);
      setSeasons(updated);
      setShowSeasonModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save season');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeason = async (id: string) => {
    if (!confirm('Are you sure you want to delete this season and all its episodes?')) return;
    try {
      await adminApi.deleteSeason(id);
      const updated = await adminApi.getSeasonsForShow(selectedShowId);
      setSeasons(updated);
      if (selectedSeasonId === id) {
        setSelectedSeasonId(updated.length > 0 ? updated[0].id : '');
      }
    } catch (err: any) {
      alert(`Failed to delete season: ${err.message}`);
    }
  };

  // --- Episode Actions ---
  const handleOpenAddEpisode = () => {
    setEditingEpisode(null);
    const nextNum = episodes.length > 0 ? Math.max(...episodes.map((e) => e.episode_number)) + 1 : 1;
    setEpisodeForm({
      episode_number: nextNum,
      title: `Episode ${nextNum}`,
      description: '',
      thumbnail_url: '',
      release_date: '',
      runtime_minutes: 45,
      video_source_type: 'embed',
      video_url: '',
      external_watch_link: '',
      download_link: '',
      is_published: true
    });
    setError(null);
    setShowEpisodeModal(true);
  };

  const handleOpenEditEpisode = (ep: Episode) => {
    setEditingEpisode(ep);
    setEpisodeForm({
      episode_number: ep.episode_number,
      title: ep.title,
      description: ep.description || '',
      thumbnail_url: ep.thumbnail_url || '',
      release_date: ep.release_date || '',
      runtime_minutes: ep.runtime_minutes || 45,
      video_source_type: ep.video_source_type || 'embed',
      video_url: ep.video_url || '',
      external_watch_link: ep.external_watch_link || '',
      download_link: ep.download_link || '',
      is_published: Boolean(ep.is_published)
    });
    setError(null);
    setShowEpisodeModal(true);
  };

  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeasonId) return;
    setSaving(true);
    setError(null);

    try {
      if (editingEpisode) {
        await adminApi.updateEpisode(editingEpisode.id, {
          ...episodeForm,
          season_id: selectedSeasonId
        });
      } else {
        await adminApi.createEpisode({
          ...episodeForm,
          season_id: selectedSeasonId
        });
      }

      const updated = await adminApi.getEpisodesForSeason(selectedSeasonId);
      setEpisodes(updated);
      setShowEpisodeModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save episode');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    try {
      await adminApi.deleteEpisode(id);
      const updated = await adminApi.getEpisodesForSeason(selectedSeasonId);
      setEpisodes(updated);
    } catch (err: any) {
      alert(`Failed to delete episode: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentShow = shows.find((s) => s.id === selectedShowId);
  const currentSeason = seasons.find((s) => s.id === selectedSeasonId);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Seasons &amp; Episodes Registry</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Hierarchical season structure, streaming embed sources, and episode metadata.
        </p>
      </div>

      {/* Select TV Show Bar */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Film className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <label className="text-xs text-neutral-400 block font-medium">Select TV Show:</label>
            <select
              value={selectedShowId}
              onChange={(e) => setSelectedShowId(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-white font-semibold text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer mt-0.5"
            >
              {shows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.release_year})
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentShow && (
          <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono">
            <span>{seasons.length} Seasons</span>
            <span>·</span>
            <span>{currentShow.episodes_count} Total Episodes</span>
          </div>
        )}
      </div>

      {shows.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-neutral-900/30 border border-neutral-800 text-xs text-neutral-400">
          No TV series exist yet. Please create a TV series first.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Seasons List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-rose-500" />
                <span>Seasons</span>
              </h3>
              <button
                onClick={handleOpenAddSeason}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Add Season</span>
              </button>
            </div>

            <div className="space-y-2">
              {seasons.map((s) => {
                const isSelected = selectedSeasonId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSeasonId(s.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-neutral-900 border-rose-600/80 shadow-sm'
                        : 'bg-neutral-900/40 hover:bg-neutral-900/80 border-neutral-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{s.title}</span>
                        {!s.is_published && (
                          <span className="text-[10px] text-amber-400 font-mono font-normal">
                            (Draft)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {s.episode_count} episodes
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditSeason(s)}
                        className="p-1 text-neutral-400 hover:text-white"
                        title="Edit season"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSeason(s.id)}
                        className="p-1 text-neutral-400 hover:text-rose-400"
                        title="Delete season"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {seasons.length === 0 && (
                <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-900/20 rounded-xl border border-neutral-850">
                  No seasons configured. Click <strong>Add Season</strong> above.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Episodes in Selected Season */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PlaySquare className="w-4 h-4 text-rose-500" />
                  <span>
                    Episodes {currentSeason ? `for ${currentSeason.title}` : ''}
                  </span>
                </h3>
              </div>

              {selectedSeasonId && (
                <button
                  onClick={handleOpenAddEpisode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Episode</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-neutral-900/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 text-center font-mono font-bold text-xs text-neutral-500">
                      E{String(ep.episode_number).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{ep.title}</span>
                        {!ep.is_published && (
                          <span className="text-[10px] text-amber-400 font-mono font-normal">
                            (Draft)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {ep.runtime_minutes} mins {ep.video_url ? '· Stream URL Linked' : '· No embed URL'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleOpenEditEpisode(ep)}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                      title="Edit episode"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEpisode(ep.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                      title="Delete episode"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {selectedSeasonId && episodes.length === 0 && (
                <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-900/20 rounded-xl border border-neutral-800">
                  No episodes in this season yet. Click <strong>Add Episode</strong> to add streaming links and synopsis.
                </div>
              )}

              {!selectedSeasonId && (
                <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-900/20 rounded-xl border border-neutral-800">
                  Please select or create a season first.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Season Modal */}
      {showSeasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingSeason ? 'Edit Season' : 'Create New Season'}
            </h3>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveSeason} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Season Number</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={seasonForm.season_number}
                  onChange={(e) => setSeasonForm({ ...seasonForm, season_number: parseInt(e.target.value) || 1 })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Season Title</label>
                <input
                  type="text"
                  required
                  value={seasonForm.title}
                  onChange={(e) => setSeasonForm({ ...seasonForm, title: e.target.value })}
                  placeholder="e.g. Season 1: The Beginning"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Season Overview</label>
                <textarea
                  rows={3}
                  value={seasonForm.overview}
                  onChange={(e) => setSeasonForm({ ...seasonForm, overview: e.target.value })}
                  placeholder="Arc summary or storyline overview..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seasonForm.is_published}
                  onChange={(e) => setSeasonForm({ ...seasonForm, is_published: e.target.checked })}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
                <span>Published (Visible to public)</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSeasonModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save Season'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Episode Modal */}
      {showEpisodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">
              {editingEpisode ? 'Edit Episode' : 'Add New Episode'}
            </h3>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveEpisode} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Episode Number</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={episodeForm.episode_number}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, episode_number: parseInt(e.target.value) || 1 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Runtime (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={episodeForm.runtime_minutes}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, runtime_minutes: parseInt(e.target.value) || 45 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Episode Title</label>
                <input
                  type="text"
                  required
                  value={episodeForm.title}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
                  placeholder="e.g. Pilot: Into the Fire"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Episode Synopsis</label>
                <textarea
                  rows={3}
                  value={episodeForm.description}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, description: e.target.value })}
                  placeholder="Plot summary for this specific episode..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Video Stream / Embed URL (YouTube or HTTPS Embed)
                </label>
                <input
                  type="text"
                  value={episodeForm.video_url}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or embed URL"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">External Watch Link (Optional)</label>
                  <input
                    type="url"
                    value={episodeForm.external_watch_link}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, external_watch_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Download Link (Optional)</label>
                  <input
                    type="url"
                    value={episodeForm.download_link}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, download_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={episodeForm.is_published}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, is_published: e.target.checked })}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
                <span>Published (Visible to public)</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowEpisodeModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save Episode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
