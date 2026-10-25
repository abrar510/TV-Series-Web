# Spectra TV – Production TV Shows & TV Series Catalog Platform

A full-stack, cinematic television series catalog and streaming guide with a secure administrative dashboard, built for deployment on **Cloudflare Workers / Pages** with **Cloudflare D1 (Distributed SQLite)** and **Cloudflare R2 (Media Storage)**.

---

## 1. Architecture Overview

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Plus Jakarta Sans typography.
- **Backend / API**:
  - **Local Runtime**: Express server running on Node.js/tsx with full-stack SQLite engine (`sql.js`), mirroring Cloudflare D1 query syntax with disk persistence (`data/database.sqlite`).
  - **Edge Deployment**: Native Cloudflare Workers / Cloudflare Pages Functions (`worker/index.ts`) bound directly to Cloudflare D1 via `env.DB`.
- **Database**: Cloudflare D1 (SQLite) with strict foreign keys, relational tables for shows, genres, seasons, episodes, and administrative sessions.
- **Media Storage**: Cloudflare R2 bucket (`tv-catalog-media`) for artwork, with fallback support for direct image uploads and validated external URLs.
- **Security**:
  - Passwords hashed with `bcryptjs`.
  - Authenticated sessions using HttpOnly, SameSite cookies and Authorization Bearer headers.
  - Brute-force rate limiting (locks after 5 consecutive failed login attempts).
  - Server-side parameterization for all SQL queries (zero string concatenation).
  - No hardcoded administrator credentials.

---

## 2. Project File Structure

```text
├── .env.example                       # Runtime environment variables
├── index.html                         # HTML entry with SEO meta tags & Google Fonts
├── metadata.json                      # AI Studio application manifest
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript strict configuration
├── vite.config.ts                     # Vite build & bundler configuration
├── wrangler.jsonc                     # Cloudflare Wrangler deployment configuration
├── migrations/
│   └── 0001_initial_schema.sql        # Standard Cloudflare D1 / SQLite migration
├── server.ts                          # Express dev server mounting Vite & API router
├── server/
│   ├── db.ts                          # SQLite engine, disk persistence & seeds
│   ├── auth.ts                        # Bcrypt hashing, session tokens & rate limiter
│   ├── routes.ts                      # Full REST API for catalog & admin CRUD
│   └── seed.ts                        # Demo seeder with rich series, seasons & episodes
├── worker/
│   └── index.ts                       # Cloudflare Workers D1 edge handler
└── src/
    ├── main.tsx                       # React application entry point
    ├── App.tsx                        # Master client-side routing & page resolver
    ├── index.css                      # Tailwind v4 styles & custom scrollbars
    ├── types/
    │   └── index.ts                   # TypeScript interfaces (TvShow, Season, Episode, etc.)
    ├── context/
    │   └── AuthContext.tsx            # Administrator session & setup provider
    ├── services/
    │   └── api.ts                     # Public and protected typed API client
    ├── components/
    │   ├── Navbar.tsx                 # 3-zone Top Bar Contract with instant search
    │   ├── HeroBanner.tsx             # Featured TV series banner with backdrop scrim
    │   ├── ShowCard.tsx               # Netflix-style dark poster cards (unboxed metadata)
    │   ├── ShowCarousel.tsx           # Horizontal scrolling with desktop arrow navigation
    │   ├── TrailerModal.tsx           # Responsive YouTube player embed
    │   ├── EmptyState.tsx             # Guidance when database has no shows
    │   └── Footer.tsx                 # Editorial footer with sitemap & policy links
    └── pages/
        ├── HomePage.tsx               # Trending, latest, acclaimed series & genres
        ├── CatalogPage.tsx            # Filterable series directory with pagination
        ├── ShowDetailPage.tsx         # /tv-show/:slug dynamic view with seasons & episodes
        ├── GenresPage.tsx             # Thematic taxonomy browsing
        ├── InfoPages.tsx              # About, Contact, Privacy, Terms
        └── admin/
            ├── AdminLogin.tsx         # Login with rate limiter & first-time setup wizard
            ├── AdminLayout.tsx        # Dashboard sidebar & mobile drawer
            ├── AdminDashboard.tsx     # Metrics, statistics, and recently updated shows
            ├── AdminShows.tsx         # Full CRUD series table with delete modal
            ├── AdminShowEditor.tsx    # Comprehensive add/edit form with image uploads
            ├── AdminSeasonsEpisodes.tsx # Dedicated hierarchical seasons & episodes manager
            ├── AdminGenres.tsx        # Manage genre taxonomy
            ├── AdminMedia.tsx         # Artwork uploader & Cloudflare R2 guide
            ├── AdminSettings.tsx      # Site settings, SEO defaults, branding
            └── AdminPassword.tsx      # Change password with bcrypt verification
```

---

## 3. Step-by-Step Cloudflare Deployment Guide

### Prerequisites
1. A free [Cloudflare Account](https://dash.cloudflare.com/sign-up).
2. [Node.js](https://nodejs.org/) (v18 or higher) installed locally.

### Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
# Authenticate your terminal with your Cloudflare account
npx wrangler login
```

### Step 2: Create your Cloudflare D1 Database
Execute the following command to create the production D1 database:
```bash
npx wrangler d1 create spectra_tv_prod
```
The command will output the database details:
```text
[[d1_databases]]
binding = "DB"
database_name = "spectra_tv_prod"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Step 3: Update `wrangler.jsonc`
Open `wrangler.jsonc` and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with the database ID returned in Step 2:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "spectra_tv_prod",
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "migrations_dir": "migrations"
  }
]
```

### Step 4: Apply Database Migrations
Run the migration file against your Cloudflare D1 database:
```bash
# Apply remotely on Cloudflare:
npx wrangler d1 migrations apply spectra_tv_prod --remote

# Or test locally:
npx wrangler d1 migrations apply spectra_tv_prod --local
```

### Step 5: (Optional) Create Cloudflare R2 Bucket
If you want zero-egress media storage for promotional posters:
```bash
npx wrangler r2 bucket create tv-catalog-media
```
In the Cloudflare Dashboard, go to **R2 > tv-catalog-media > Settings > Custom Domains** and connect a domain (e.g. `media.yourdomain.com`) for public image delivery.

### Step 6: Build and Deploy
```bash
# 1. Build the React frontend
npm run build

# 2. Deploy to Cloudflare Workers with Static Assets
npx wrangler deploy
```

---

## 4. Secure Initial Administrator Setup

1. Open your browser and navigate to `/admin/login`.
2. Because no administrator credentials exist out of the box, the system automatically presents the **Initial Administrator Setup** form.
3. Enter your administrator display name, email, and a secure password (minimum 8 characters).
4. Click **Create Administrator Account**. The system will:
   - Hash your password using `bcryptjs` with salt rounds.
   - Store the record in the `admins` table.
   - Generate a cryptographically secure 256-bit session token.
   - Set an `HttpOnly`, `SameSite=Lax` session cookie.
   - Redirect you directly into the Admin Dashboard.
5. Once created, the setup endpoint is permanently locked. Future logins will require valid credentials and will be protected by brute-force rate limiting (5 attempts per 15 minutes).

---

## 5. Adding Your First TV Series, Season, and Episode

1. In the Admin Dashboard sidebar, click **Add New TV Show**.
2. Fill in:
   - **Title**: e.g. *Breaking Bad*
   - **Slug**: auto-generated as `breaking-bad` (editable)
   - **Poster Image**: upload a local file or paste an image URL
   - **Backdrop Image**: upload a cinematic 16:9 banner
   - **Overview & Description**: series synopsis
   - **Genres**: check Drama, Crime, Thriller
   - **Release Year & IMDb Rating**: e.g., `2008`, `9.5`
   - **YouTube Trailer ID**: e.g., `HhesaQXLuRY`
   - Check **Published** and click **Publish Series**.
3. In the sidebar, click **Seasons & Episodes**:
   - Select your new series from the dropdown.
   - Click **Add Season** (e.g. Season 1).
   - Click **Add Episode** under Season 1:
     - Episode 1: *Pilot*
     - Runtime: `58` minutes
     - Video URL: official YouTube link or embed URL
     - Click **Save Episode**.
4. Open the public catalog at `/` or `/tv-show/breaking-bad` to see your series live!

---

## 6. Free-Tier Features vs Paid Services

| Service | Cloudflare Free-Tier Allowance | Status in Spectra TV |
| :--- | :--- | :--- |
| **Cloudflare Workers** | 100,000 requests/day | **100% Free** |
| **Cloudflare Pages** | Unlimited bandwidth & requests | **100% Free** |
| **Cloudflare D1 (SQLite)** | 5M read rows/day, 100k write rows/day, 5 GB storage | **100% Free** for standard catalogs |
| **Cloudflare R2** | 10 GB storage/month, 10M Class B operations | **100% Free** within limits, no egress fees |
| **Custom Domain & SSL** | Unlimited free SSL/TLS certificates | **100% Free** |

---

## 7. Testing & Verification Checklist

- [x] **Database & Migrations**: All tables (`tv_shows`, `genres`, `tv_show_genres`, `seasons`, `episodes`, `admins`, `admin_sessions`, `login_attempts`, `site_settings`) created with foreign keys.
- [x] **Rate Limiting**: IP tracking prevents brute-force attempts on `/api/admin/login` after 5 failed tries.
- [x] **Safe Admin Initialization**: One-time setup wizard when 0 admins exist; locked out once created.
- [x] **CRUD Operations**: Series, seasons, and episodes can be created, updated, published, and deleted.
- [x] **Draft Privacy**: Unchecked/Draft shows and episodes are strictly omitted from public endpoints (`is_published = 1` filter).
- [x] **Zero-Pill Discipline**: Metadata displayed with clean unboxed text and typographic separators (`·`).
- [x] **Search & Filters**: Database-backed search by title, cast, and overview; filtering by genre, release status, and IMDb rating.
- [x] **SEO & Social Sharing**: Dynamic sitemap at `/sitemap.xml`, `/robots.txt`, and Schema.org `TVSeries` JSON-LD structured data.
