export interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  show_count?: number;
}

export interface Episode {
  id: string;
  season_id: string;
  tv_show_id: string;
  episode_number: number;
  season_number: number;
  title: string;
  description?: string;
  thumbnail_url?: string;
  release_date?: string;
  runtime_minutes: number;
  video_source_type: 'embed' | 'youtube' | 'hls' | 'direct';
  video_url?: string;
  external_watch_link?: string;
  download_link?: string;
  display_order: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  tv_show_id: string;
  season_number: number;
  title: string;
  overview?: string;
  poster_url?: string;
  release_date?: string;
  episode_count: number;
  display_order: number;
  is_published: number;
  created_at: string;
  updated_at: string;
  episodes?: Episode[];
}

export interface TvShow {
  id: string;
  title: string;
  slug: string;
  original_title?: string;
  overview: string;
  full_description?: string;
  release_year: number;
  end_year?: number | null;
  status: 'Ongoing' | 'Completed' | 'Upcoming';
  country?: string;
  language?: string;
  imdb_rating: number;
  seasons_count: number;
  episodes_count: number;
  cast_members?: string;
  director?: string;
  creator?: string;
  poster_url?: string;
  backdrop_url?: string;
  youtube_trailer_id?: string;
  seo_title?: string;
  seo_meta_description?: string;
  keywords?: string;
  is_featured: number;
  is_trending: number;
  is_published: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  genres?: Genre[];
  seasons?: Season[];
  related?: TvShow[];
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

export interface DashboardStats {
  totalShows: number;
  publishedShows: number;
  draftShows: number;
  totalSeasons: number;
  totalEpisodes: number;
  recentlyUpdated: Array<{
    id: string;
    title: string;
    slug: string;
    is_published: number;
    imdb_rating: number;
    updated_at: string;
  }>;
}

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  site_description: string;
  contact_email: string;
  footer_text: string;
  r2_bucket_name?: string;
  r2_public_domain?: string;
  enable_downloads?: string;
  default_trailer_youtube_id?: string;
  primary_accent_color?: string;
  [key: string]: string | undefined;
}
