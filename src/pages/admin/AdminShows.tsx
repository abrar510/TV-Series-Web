import React, { useState, useEffect } from 'react';
import { TvShow } from '../../types';
import { adminApi } from '../../services/api';
import { PlusCircle, Search, Edit3, Trash2, ExternalLink, Film, AlertTriangle } from 'lucide-react';

interface AdminShowsProps {
  onAddNew: () => void;
  onEditShow: (id: string) => void;
  onViewLive: (slug: string) => void;
}

export const AdminShows: React.FC<AdminShowsProps> = ({ onAddNew, onEditShow, onViewLive }) => {
  const [shows, setShows] = useState<TvShow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [publicationFilter, setPublicationFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<TvShow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchShows = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getShows({
        page,
        limit: 15,
        search: search.trim() || undefined,
        publication: publicationFilter !== 'all' ? publicationFilter : undefined
      });
      setShows(res.shows);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch admin shows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, [page, publicationFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShows();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteShow(deleteTarget.id);
      setDeleteTarget(null);
      await fetchShows();
    } catch (err: any) {
      alert(`Error deleting series: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">All TV Series</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage titles, publication states, seasons, and metadata in Cloudflare D1.
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-md self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New TV Show</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search series by title or slug..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-neutral-500">Status:</span>
          <select
            value={publicationFilter}
            onChange={(e) => {
              setPublicationFilter(e.target.value);
              setPage(1);
            }}
            className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="all">All States</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Shows Table */}
      <div className="rounded-xl bg-neutral-900/40 border border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-7 h-7 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-neutral-400">Loading series list...</span>
          </div>
        ) : shows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 text-neutral-400 border-b border-neutral-800 font-medium">
                <tr>
                  <th className="px-4 py-3">Poster</th>
                  <th className="px-4 py-3">Title &amp; Slug</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Seasons</th>
                  <th className="px-4 py-3">IMDb</th>
                  <th className="px-4 py-3">Publication</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {shows.map((show) => (
                  <tr key={show.id} className="hover:bg-neutral-900/50 transition-colors">
                    <td className="px-4 py-3">
                      {show.poster_url ? (
                        <img
                          src={show.poster_url}
                          alt={show.title}
                          referrerPolicy="no-referrer"
                          className="w-9 h-12 object-cover rounded bg-neutral-950 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-12 rounded bg-neutral-950 flex items-center justify-center text-neutral-600">
                          <Film className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-white truncate">{show.title}</div>
                      <div className="text-[11px] font-mono text-neutral-500 truncate">/{show.slug}</div>
                      {show.genres && show.genres.length > 0 && (
                        <div className="text-[10px] text-neutral-400 mt-0.5 truncate">
                          {show.genres.map((g) => g.name).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">{show.release_year}</td>
                    <td className="px-4 py-3 font-mono">{show.seasons_count}</td>
                    <td className="px-4 py-3 font-mono text-amber-400">★ {show.imdb_rating.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        show.is_published ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {show.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {show.is_published === 1 && (
                        <button
                          onClick={() => onViewLive(show.slug)}
                          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="View on site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditShow(show.id)}
                        className="p-1.5 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Edit series"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(show)}
                        className="p-1.5 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete series"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-neutral-400">
            No TV series found matching current query.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Delete "{deleteTarget.title}"?</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                This will permanently remove this TV series along with all associated seasons, episodes, and genre bindings from the database. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shadow-md"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Series'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
