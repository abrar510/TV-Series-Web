import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ShowDetailPage } from './pages/ShowDetailPage';
import { GenresPage } from './pages/GenresPage';
import { InfoPages } from './pages/InfoPages';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminShows } from './pages/admin/AdminShows';
import { AdminShowEditor } from './pages/admin/AdminShowEditor';
import { AdminSeasonsEpisodes } from './pages/admin/AdminSeasonsEpisodes';
import { AdminGenres } from './pages/admin/AdminGenres';
import { AdminMedia } from './pages/admin/AdminMedia';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminPassword } from './pages/admin/AdminPassword';
import { publicApi } from './services/api';
import { SiteSettings } from './types';
import { Film } from 'lucide-react';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname + window.location.search);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [editingShowId, setEditingShowId] = useState<string | null>(null);

  // Load public settings
  useEffect(() => {
    publicApi.getPublicSettings()
      .then((data) => setSiteSettings(data))
      .catch(console.error);
  }, []);

  // Listen to browser popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Client-side Navigation helper
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pathname = currentPath.split('?')[0];
  const searchParams = new URLSearchParams(currentPath.includes('?') ? currentPath.split('?')[1] : '');

  // ---------------------------------------------------------------------------
  // Admin Routes Handling
  // ---------------------------------------------------------------------------
  if (pathname === '/admin/login') {
    return <AdminLogin onNavigate={navigate} />;
  }

  if (pathname.startsWith('/admin')) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!user) {
      return <AdminLogin onNavigate={navigate} />;
    }

    return (
      <AdminLayout
        currentTab={adminTab}
        onSelectTab={(tab) => {
          setAdminTab(tab);
          if (tab !== 'add-show') setEditingShowId(null);
        }}
        onNavigateHome={() => navigate('/')}
      >
        {adminTab === 'dashboard' && (
          <AdminDashboard
            onSelectTab={(t) => setAdminTab(t)}
            onEditShow={(id) => {
              setEditingShowId(id);
              setAdminTab('edit-show');
            }}
          />
        )}

        {adminTab === 'shows' && (
          <AdminShows
            onAddNew={() => {
              setEditingShowId(null);
              setAdminTab('add-show');
            }}
            onEditShow={(id) => {
              setEditingShowId(id);
              setAdminTab('edit-show');
            }}
            onViewLive={(slug) => navigate(`/tv-show/${slug}`)}
          />
        )}

        {(adminTab === 'add-show' || adminTab === 'edit-show') && (
          <AdminShowEditor
            showId={editingShowId}
            onBack={() => {
              setEditingShowId(null);
              setAdminTab('shows');
            }}
            onSaved={(id, slug) => {
              setEditingShowId(null);
              setAdminTab('shows');
            }}
          />
        )}

        {adminTab === 'seasons' && <AdminSeasonsEpisodes />}
        {adminTab === 'genres' && <AdminGenres />}
        {adminTab === 'media' && <AdminMedia />}
        {adminTab === 'settings' && <AdminSettings />}
        {adminTab === 'password' && <AdminPassword />}
      </AdminLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // Public Routes Handling
  // ---------------------------------------------------------------------------
  let pageContent: React.ReactNode = null;

  if (pathname === '/' || pathname === '') {
    pageContent = <HomePage onNavigate={navigate} />;
  } else if (pathname === '/shows') {
    pageContent = (
      <CatalogPage
        onNavigate={navigate}
        initialGenre={searchParams.get('genre') || ''}
        initialSort={searchParams.get('sort') || 'newest'}
        initialTrending={searchParams.get('trending') === 'true'}
      />
    );
  } else if (pathname === '/genres') {
    pageContent = (
      <GenresPage
        onSelectGenre={(genreSlug) => navigate(`/shows?genre=${genreSlug}`)}
      />
    );
  } else if (pathname.startsWith('/tv-show/')) {
    const slug = pathname.replace('/tv-show/', '');
    pageContent = <ShowDetailPage slug={slug} onNavigate={navigate} />;
  } else if (pathname === '/about') {
    pageContent = <InfoPages type="about" siteName={siteSettings?.site_name} />;
  } else if (pathname === '/contact') {
    pageContent = <InfoPages type="contact" siteName={siteSettings?.site_name} contactEmail={siteSettings?.contact_email} />;
  } else if (pathname === '/privacy') {
    pageContent = <InfoPages type="privacy" siteName={siteSettings?.site_name} />;
  } else if (pathname === '/terms') {
    pageContent = <InfoPages type="terms" siteName={siteSettings?.site_name} />;
  } else {
    // Custom 404 Page
    pageContent = (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <Film className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">404 - Page Not Found</h1>
        <p className="text-sm text-neutral-400 max-w-md mb-6">
          The requested TV series, season, or catalog view could not be located.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
        >
          Return to Catalog Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 selection:bg-rose-600 selection:text-white">
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        siteName={siteSettings?.site_name || 'SPECTRA'}
      />
      
      <main className="flex-1">
        {pageContent}
      </main>

      <Footer
        siteName={siteSettings?.site_name || 'SPECTRA'}
        footerText={siteSettings?.footer_text}
        onNavigate={navigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
