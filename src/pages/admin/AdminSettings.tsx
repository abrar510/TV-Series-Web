import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { SiteSettings } from '../../types';
import { Settings, Save, Check, AlertCircle, Globe, Shield } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: '',
    site_tagline: '',
    site_description: '',
    contact_email: '',
    footer_text: '',
    default_trailer_youtube_id: '',
    primary_accent_color: '#e11d48'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getSettings()
      .then((data) => setSettings(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      await adminApi.updateSettings(settings);
      setSuccess('Website settings updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-black text-white tracking-tight">Website Settings &amp; SEO Defaults</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Configure site identity, branding, global meta tags, and edge delivery parameters.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Branding & Identity */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Brand Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Website Brand Name</label>
              <input
                type="text"
                required
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.site_tagline}
                onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Global SEO Description</label>
            <textarea
              rows={2}
              value={settings.site_description}
              onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Editorial Contact Email</label>
              <input
                type="email"
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Default Fallback Trailer (YouTube ID)</label>
              <input
                type="text"
                value={settings.default_trailer_youtube_id || ''}
                onChange={(e) => setSettings({ ...settings, default_trailer_youtube_id: e.target.value })}
                placeholder="HhesaQXLuRY"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Footer Copyright Notice</label>
            <input
              type="text"
              value={settings.footer_text}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Site Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
