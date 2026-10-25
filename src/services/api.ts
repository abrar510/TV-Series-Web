import { TvShow, Genre, Season, Episode, DashboardStats, SiteSettings, AdminUser } from '../types';

const TOKEN_KEY = 'spectra_admin_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include' // transmit cookies
  });

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
      const text = await res.text();
      if (text) errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

// -----------------------------------------------------------------------------
// Public API Calls
// -----------------------------------------------------------------------------

export const publicApi = {
  getShows: (params: {
    page?: number;
    limit?: number;
    search?: string;
    genre?: string;
    status?: string;
    sort?: string;
    featured?: boolean;
    trending?: boolean;
  } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.search) sp.set('search', params.search);
    if (params.genre) sp.set('genre', params.genre);
    if (params.status) sp.set('status', params.status);
    if (params.sort) sp.set('sort', params.sort);
    if (params.featured) sp.set('featured', 'true');
    if (params.trending) sp.set('trending', 'true');

    return request<{
      shows: TvShow[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/shows?${sp.toString()}`);
  },

  getShowBySlug: (slug: string) => {
    return request<TvShow>(`/api/shows/${encodeURIComponent(slug)}`);
  },

  getShowSeasons: (slug: string) => {
    return request<Season[]>(`/api/shows/${encodeURIComponent(slug)}/seasons`);
  },

  getShowEpisodes: (slug: string, seasonNumber?: number) => {
    const q = seasonNumber ? `?season=${seasonNumber}` : '';
    return request<Episode[]>(`/api/shows/${encodeURIComponent(slug)}/episodes${q}`);
  },

  getGenres: () => {
    return request<Genre[]>('/api/genres');
  },

  search: (query: string) => {
    return request<TvShow[]>(`/api/search?q=${encodeURIComponent(query)}`);
  },

  getPublicSettings: () => {
    return request<SiteSettings>('/api/settings/public');
  }
};

// -----------------------------------------------------------------------------
// Admin API Calls
// -----------------------------------------------------------------------------

export const adminApi = {
  getSetupStatus: () => {
    return request<{ needsSetup: boolean; adminCount: number }>('/api/admin/setup-status');
  },

  setupInitialAdmin: (data: { email: string; password: string; display_name: string }) => {
    return request<{ success: boolean; token: string; user: AdminUser }>('/api/admin/setup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  login: (credentials: { email: string; password: string }) => {
    return request<{ success: boolean; token: string; user: AdminUser }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  logout: () => {
    return request<{ success: boolean }>('/api/admin/logout', { method: 'POST' });
  },

  getMe: () => {
    return request<{ user: AdminUser }>('/api/admin/me');
  },

  changePassword: (data: { currentPassword: string; newPassword: string }) => {
    return request<{ success: boolean; message: string }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getStats: () => {
    return request<DashboardStats>('/api/admin/stats');
  },

  getShows: (params: { page?: number; limit?: number; search?: string; status?: string; publication?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.search) sp.set('search', params.search);
    if (params.status) sp.set('status', params.status);
    if (params.publication) sp.set('publication', params.publication);

    return request<{
      shows: TvShow[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/admin/shows?${sp.toString()}`);
  },

  getShowById: (id: string) => {
    return request<TvShow>(`/api/admin/shows/${encodeURIComponent(id)}`);
  },

  createShow: (showData: any) => {
    return request<{ success: boolean; id: string; slug: string }>('/api/admin/shows', {
      method: 'POST',
      body: JSON.stringify(showData)
    });
  },

  updateShow: (id: string, showData: any) => {
    return request<{ success: boolean; id: string; slug: string }>(`/api/admin/shows/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(showData)
    });
  },

  deleteShow: (id: string) => {
    return request<{ success: boolean }>(`/api/admin/shows/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  // Seasons
  getSeasonsForShow: (showId: string) => {
    return request<Season[]>(`/api/admin/shows/${encodeURIComponent(showId)}/seasons`);
  },

  createSeason: (seasonData: any) => {
    return request<{ success: boolean; id: string }>('/api/admin/seasons', {
      method: 'POST',
      body: JSON.stringify(seasonData)
    });
  },

  updateSeason: (id: string, seasonData: any) => {
    return request<{ success: boolean }>(`/api/admin/seasons/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(seasonData)
    });
  },

  deleteSeason: (id: string) => {
    return request<{ success: boolean }>(`/api/admin/seasons/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  // Episodes
  getEpisodesForSeason: (seasonId: string) => {
    return request<Episode[]>(`/api/admin/seasons/${encodeURIComponent(seasonId)}/episodes`);
  },

  createEpisode: (episodeData: any) => {
    return request<{ success: boolean; id: string }>('/api/admin/episodes', {
      method: 'POST',
      body: JSON.stringify(episodeData)
    });
  },

  updateEpisode: (id: string, episodeData: any) => {
    return request<{ success: boolean }>(`/api/admin/episodes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(episodeData)
    });
  },

  deleteEpisode: (id: string) => {
    return request<{ success: boolean }>(`/api/admin/episodes/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  // Genres
  getGenres: () => {
    return request<Genre[]>('/api/admin/genres');
  },

  createGenre: (data: { name: string; slug?: string; description?: string }) => {
    return request<{ success: boolean; id: string; name: string; slug: string }>('/api/admin/genres', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteGenre: (id: string) => {
    return request<{ success: boolean }>(`/api/admin/genres/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  // Settings
  getSettings: () => {
    return request<SiteSettings>('/api/admin/settings');
  },

  updateSettings: (settings: Partial<SiteSettings>) => {
    return request<{ success: boolean; message: string }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  // Media
  uploadImage: (payload: { url?: string; base64Data?: string; filename?: string }) => {
    return request<{ success: boolean; url: string; storageKey?: string; source?: string }>('/api/admin/upload', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Demo Seeder
  seedDemo: () => {
    return request<{ success: boolean; message: string }>('/api/admin/seed-demo', {
      method: 'POST'
    });
  }
};
