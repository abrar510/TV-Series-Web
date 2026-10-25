-- Cloudflare D1 / SQLite Schema Migration: 0001_initial_schema.sql
-- TV Shows & TV Series Catalog Database Schema

PRAGMA foreign_keys = ON;

-- 1. Administrators
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Administrator Sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- 3. Login Attempt Rate Limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  ip_address TEXT NOT NULL,
  attempt_time TEXT NOT NULL
);

-- 4. TV Shows
CREATE TABLE IF NOT EXISTS tv_shows (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  original_title TEXT,
  overview TEXT,
  full_description TEXT,
  release_year INTEGER NOT NULL,
  end_year INTEGER,
  status TEXT DEFAULT 'Ongoing', -- 'Ongoing', 'Completed', 'Upcoming'
  country TEXT DEFAULT 'United States',
  language TEXT DEFAULT 'English',
  imdb_rating REAL DEFAULT 0.0,
  seasons_count INTEGER DEFAULT 0,
  episodes_count INTEGER DEFAULT 0,
  cast_members TEXT,
  director TEXT,
  creator TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  youtube_trailer_id TEXT,
  seo_title TEXT,
  seo_meta_description TEXT,
  keywords TEXT,
  is_featured INTEGER DEFAULT 0,
  is_trending INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 5. Genres
CREATE TABLE IF NOT EXISTS genres (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT
);

-- 6. TV Show - Genre Relationship
CREATE TABLE IF NOT EXISTS tv_show_genres (
  tv_show_id TEXT NOT NULL,
  genre_id TEXT NOT NULL,
  PRIMARY KEY (tv_show_id, genre_id),
  FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- 7. Seasons
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  tv_show_id TEXT NOT NULL,
  season_number INTEGER NOT NULL,
  title TEXT,
  overview TEXT,
  poster_url TEXT,
  release_date TEXT,
  episode_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 1,
  is_published INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) ON DELETE CASCADE,
  UNIQUE (tv_show_id, season_number)
);

-- 8. Episodes
CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL,
  tv_show_id TEXT NOT NULL,
  episode_number INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  release_date TEXT,
  runtime_minutes INTEGER DEFAULT 45,
  video_source_type TEXT DEFAULT 'embed', -- 'embed', 'youtube', 'hls', 'direct'
  video_url TEXT,
  external_watch_link TEXT,
  download_link TEXT,
  display_order INTEGER DEFAULT 1,
  is_published INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) ON DELETE CASCADE,
  UNIQUE (season_id, episode_number)
);

-- 9. Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tv_shows_slug ON tv_shows(slug);
CREATE INDEX IF NOT EXISTS idx_tv_shows_published ON tv_shows(is_published);
CREATE INDEX IF NOT EXISTS idx_tv_shows_featured ON tv_shows(is_featured);
CREATE INDEX IF NOT EXISTS idx_tv_shows_trending ON tv_shows(is_trending);
CREATE INDEX IF NOT EXISTS idx_seasons_show ON seasons(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season ON episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_episodes_show ON episodes(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, attempt_time);
