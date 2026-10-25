import React, { useState } from 'react';
import { Film, Shield, Send, CheckCircle2 } from 'lucide-react';

interface InfoPagesProps {
  type: 'about' | 'contact' | 'privacy' | 'terms';
  siteName?: string;
  contactEmail?: string;
}

export const InfoPages: React.FC<InfoPagesProps> = ({
  type,
  siteName = 'Spectra TV',
  contactEmail = 'contact@spectratv.com'
}) => {
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  if (type === 'about') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-neutral-300 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">About {siteName}</h1>
          <p className="text-neutral-400 mt-2 text-sm leading-relaxed">
            A high-performance cinematic catalog for television series, multi-season archives, and verified episode registries.
          </p>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            {siteName} was built to provide television enthusiasts and media archivists with an uncompromised, distraction-free destination to discover and organize serialized entertainment. Powered by Cloudflare D1 distributed SQLite and modern Edge Workers, {siteName} delivers sub-millisecond page views and instantaneous search without algorithmic clutter.
          </p>
          <h2 className="text-lg font-bold text-white pt-4">Our Principles</h2>
          <ul className="list-disc list-inside space-y-2 text-neutral-400">
            <li><strong>Editorial Clarity:</strong> Clean unboxed typography and uncluttered visual hierarchy designed for readability.</li>
            <li><strong>Verified Data:</strong> Official episode guides, verified runtimes, direct YouTube trailer links, and accurate IMDb metrics.</li>
            <li><strong>Fast Edge Delivery:</strong> Global CDN caching and server-side parameterized SQLite queries.</li>
          </ul>
        </div>
      </div>
    );
  }

  if (type === 'contact') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Contact Editorial</h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Have questions regarding series listings, licensing, or press inquiries? Reach out to our team at <strong className="text-white">{contactEmail}</strong>.
          </p>
        </div>

        {sent ? (
          <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Message Dispatched</h3>
            <p className="text-xs text-neutral-400">Thank you for reaching out. An editorial staff member will review your note shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Inquiry Details</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>
    );
  }

  if (type === 'privacy') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-neutral-300 space-y-6 text-sm leading-relaxed">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-neutral-500 font-mono">Last updated: October 2026</p>
        <p>
          At {siteName}, we respect your personal privacy. We do not sell, trade, or transfer your personal data to outside parties.
        </p>
        <h2 className="text-base font-bold text-white pt-2">Data Storage &amp; Edge Processing</h2>
        <p>
          Public navigation logs and search queries are processed anonymously through Cloudflare Edge networks to generate traffic analytics and prevent distributed denial-of-service attempts. No cookies are stored on public user browsers other than session cookies reserved exclusively for authenticated administrative operations.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-neutral-300 space-y-6 text-sm leading-relaxed">
      <h1 className="text-3xl font-extrabold text-white tracking-tight">Terms of Service</h1>
      <p className="text-xs text-neutral-500 font-mono">Effective: October 2026</p>
      <p>
        By accessing {siteName}, you agree to adhere to all applicable laws and ethical content consumption guidelines.
      </p>
      <h2 className="text-base font-bold text-white pt-2">Intellectual Property &amp; Video Embeds</h2>
      <p>
        All television trademarks, series posters, and production rights belong to their respective copyright holders. {siteName} provides an index and metadata catalog using official public YouTube embeds and authorized media hosting providers without circumventing digital rights management or provider access controls.
      </p>
    </div>
  );
};
