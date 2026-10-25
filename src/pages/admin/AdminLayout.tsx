import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Film,
  PlusCircle,
  FolderTree,
  Tags,
  Image as ImageIcon,
  Settings,
  KeyRound,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onNavigateHome,
  children
}) => {
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'shows', label: 'All TV Shows', icon: Film },
    { id: 'add-show', label: 'Add New TV Show', icon: PlusCircle },
    { id: 'seasons', label: 'Seasons & Episodes', icon: FolderTree },
    { id: 'genres', label: 'Genres', icon: Tags },
    { id: 'media', label: 'Media & Cloud Storage', icon: ImageIcon },
    { id: 'settings', label: 'Website Settings & SEO', icon: Settings },
    { id: 'password', label: 'Change Password', icon: KeyRound },
  ];

  const handleLogout = async () => {
    await logout();
    onNavigateHome();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-neutral-950 border-r border-neutral-900 text-sm">
      <div className="space-y-6">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white tracking-wider uppercase">SPECTRA ADMIN</div>
            <div className="text-[11px] text-neutral-400 font-mono">D1 Edge Console</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Actions */}
      <div className="pt-4 border-t border-neutral-900 space-y-2">
        <button
          onClick={onNavigateHome}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
        >
          <span>View Public Site</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        {user && (
          <div className="px-3 py-2 bg-neutral-900/60 rounded-lg border border-neutral-800/80">
            <div className="text-xs font-semibold text-white truncate">{user.display_name}</div>
            <div className="text-[11px] text-neutral-400 truncate">{user.email}</div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-neutral-950 text-neutral-100">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 h-full bg-neutral-950 z-10 shadow-2xl">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-neutral-950 border-b border-neutral-900 sticky top-0 z-30">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 text-neutral-400 hover:text-white cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            {menuItems.find((m) => m.id === currentTab)?.label || 'Dashboard'}
          </span>
          <button
            onClick={onNavigateHome}
            className="text-xs text-rose-500 hover:text-rose-400 font-semibold"
          >
            Live Site
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
};
