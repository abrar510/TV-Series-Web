import React, { useState, useEffect } from 'react';
import { Genre } from '../../types';
import { adminApi } from '../../services/api';
import { Tags, PlusCircle, Trash2, Check, AlertCircle } from 'lucide-react';

export const AdminGenres: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadGenres = async () => {
    try {
      const data = await adminApi.getGenres();
      setGenres(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGenres();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adminApi.createGenre({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      setSuccess('Genre created successfully');
      await loadGenres();
    } catch (err: any) {
      setError(err.message || 'Failed to create genre');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, genreName: string) => {
    if (!confirm(`Are you sure you want to remove the genre "${genreName}"?`)) return;
    try {
      await adminApi.deleteGenre(id);
      await loadGenres();
    } catch (err: any) {
      alert(`Error deleting genre: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Genres Registry</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Manage categorization tags and thematic taxonomy for all catalog TV shows.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-2.5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>{success}</div>
        </div>
      )}

      {/* Add New Genre Box */}
      <form onSubmit={handleCreate} className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
          Add New Genre
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Genre Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cyberpunk"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="High tech and dystopian noir"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{saving ? 'Adding...' : 'Add Genre'}</span>
          </button>
        </div>
      </form>

      {/* Genres List */}
      <div className="rounded-xl bg-neutral-900/40 border border-neutral-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
            <tr>
              <th className="px-4 py-3">Genre Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Linked Series</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
            {genres.map((g) => (
              <tr key={g.id} className="hover:bg-neutral-900/50">
                <td className="px-4 py-3 font-semibold text-white">{g.name}</td>
                <td className="px-4 py-3 font-mono text-neutral-400">{g.slug}</td>
                <td className="px-4 py-3 text-neutral-400 max-w-xs truncate">{g.description || '—'}</td>
                <td className="px-4 py-3 font-mono text-neutral-400">{g.show_count || 0}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(g.id, g.name)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete genre"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
