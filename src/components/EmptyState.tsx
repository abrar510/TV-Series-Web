import React from 'react';
import { Film, PlusCircle, Sparkles, Shield } from 'lucide-react';

interface EmptyStateProps {
  onGoToAdmin: () => void;
  onSeedDemo?: () => void;
  seeding?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onGoToAdmin, onSeedDemo, seeding = false }) => {
  return (
    <div className="max-w-2xl mx-auto my-16 px-6 py-12 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4">
        <Film className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">
        Catalog Database is Ready
      </h3>

      <p className="text-sm text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed">
        Your SQLite / Cloudflare D1 database has been connected. No published TV shows exist yet. You can add your first series through the secure Admin Dashboard, or populate the catalog with demo series.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onSeedDemo && (
          <button
            onClick={onSeedDemo}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>{seeding ? 'Populating Demo Shows...' : 'Populate High-Quality Demo Shows'}</span>
          </button>
        )}

        <button
          onClick={onGoToAdmin}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer border border-neutral-700"
        >
          <Shield className="w-4 h-4 text-rose-400" />
          <span>Open Admin Dashboard</span>
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-neutral-800/80 text-left text-xs text-neutral-400">
        <p className="font-semibold text-neutral-300 mb-2">Admin Dashboard Instructions:</p>
        <ol className="list-decimal list-inside space-y-1 text-neutral-400">
          <li>Log in or complete the one-time initial administrator setup at <code className="text-rose-400 bg-neutral-950 px-1 py-0.5 rounded">/admin/login</code>.</li>
          <li>Navigate to <strong>Add New TV Show</strong> to enter title, overview, trailer, and poster URLs.</li>
          <li>Add seasons and episodes with streaming links or YouTube embed IDs.</li>
          <li>Set publication status to <strong>Published</strong> to immediately present them on the live catalog.</li>
        </ol>
      </div>
    </div>
  );
};
