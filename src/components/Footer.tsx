import React from 'react';
import { Film } from 'lucide-react';

interface FooterProps {
  siteName?: string;
  footerText?: string;
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  siteName = 'SPECTRA',
  footerText,
  onNavigate
}) => {
  return (
    <footer className="w-full bg-neutral-950 border-t border-neutral-900 mt-20 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-rose-600 flex items-center justify-center text-white">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-wider text-white uppercase">
                {siteName}
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Curated television series catalog featuring detailed season guides, verified episode registries, and high-definition official trailers.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-200 mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors cursor-pointer">
                  Featured Shows
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/shows')} className="hover:text-white transition-colors cursor-pointer">
                  All Series Catalog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/genres')} className="hover:text-white transition-colors cursor-pointer">
                  Browse by Genre
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/shows?sort=rating')} className="hover:text-white transition-colors cursor-pointer">
                  Top Rated Series
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-200 mb-3">
              Information
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors cursor-pointer">
                  About Spectra TV
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors cursor-pointer">
                  Contact Editorial
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors cursor-pointer">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Administration & Edge Tech */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-200 mb-3">
              Platform
            </h4>
            <p className="text-xs text-neutral-400 mb-3">
              Powered by Cloudflare D1 and Cloudflare Workers architecture with sub-millisecond edge database queries.
            </p>
            <button
              onClick={() => onNavigate('/admin/login')}
              className="text-xs font-medium text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Administrator Login →
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>
            {footerText || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`}
          </p>
          <div className="flex items-center gap-4">
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400">
              XML Sitemap
            </a>
            <span aria-hidden="true">·</span>
            <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400">
              Robots.txt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
