import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase, queryAll, queryOne, execute } from './db.js';
import {
  hashPassword,
  comparePassword,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  createSession,
  validateSession,
  deleteSession,
  countAdmins,
  generateId,
  AdminUser
} from './auth.js';
import { seedDemoData } from './seed.js';

export const router = Router();

// Middleware to extract client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Admin Authentication Middleware
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const db = await getDatabase();
  let token = req.cookies?.admin_session;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Admin session required' });
    return;
  }

  const user = validateSession(db, token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    return;
  }

  (req as any).admin = user;
  (req as any).sessionToken = token;
  next();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// -----------------------------------------------------------------------------
// PUBLIC ENDPOINTS
// -----------------------------------------------------------------------------

// 1. GET /api/shows
router.get('/shows', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 18));
    const offset = (page - 1) * limit;

    const search = (req.query.search as string || '').trim();
    const genre = (req.query.genre as string || '').trim();
    const status = (req.query.status as string || '').trim();
    const sort = (req.query.sort as string || 'newest').trim();
    const featured = req.query.featured === 'true';
    const trending = req.query.trending === 'true';

    let whereClauses: string[] = ['s.is_published = 1'];
    let params: any[] = [];

    if (search) {
      whereClauses.push('(s.title LIKE ? OR s.original_title LIKE ? OR s.overview LIKE ? OR s.cast_members LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      whereClauses.push('s.status = ?');
      params.push(status);
    }

    if (featured) {
      whereClauses.push('s.is_featured = 1');
    }

    if (trending) {
      whereClauses.push('s.is_trending = 1');
    }

    let genreJoin = '';
    if (genre) {
      genreJoin = 'JOIN tv_show_genres tsg ON s.id = tsg.tv_show_id JOIN genres g ON tsg.genre_id = g.id';
      whereClauses.push('(g.slug = ? OR g.id = ?)');
      params.push(genre, genre);
    }

    let orderBy = 's.created_at DESC';
    if (sort === 'rating') {
      orderBy = 's.imdb_rating DESC';
    } else if (sort === 'title') {
      orderBy = 's.title ASC';
    } else if (sort === 'year') {
      orderBy = 's.release_year DESC';
    } else if (sort === 'popular') {
      orderBy = 's.view_count DESC, s.imdb_rating DESC';
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count query
    const countSql = `SELECT COUNT(DISTINCT s.id) as count FROM tv_shows s ${genreJoin} ${whereSql}`;
    const countRes = queryOne<{ count: number }>(db, countSql, params);
    const total = countRes ? countRes.count : 0;

    // Fetch shows
    const querySql = `
      SELECT DISTINCT
        s.id, s.title, s.slug, s.original_title, s.overview, s.release_year, s.end_year,
        s.status, s.country, s.language, s.imdb_rating, s.seasons_count, s.episodes_count,
        s.cast_members, s.director, s.creator, s.poster_url, s.backdrop_url, s.youtube_trailer_id,
        s.is_featured, s.is_trending, s.view_count, s.created_at, s.updated_at
      FROM tv_shows s
      ${genreJoin}
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const shows = queryAll(db, querySql, [...params, limit, offset]);

    // Attach genres to each show
    for (const show of shows) {
      const showGenres = queryAll(
        db,
        `SELECT g.id, g.name, g.slug FROM genres g
         JOIN tv_show_genres tsg ON g.id = tsg.genre_id
         WHERE tsg.tv_show_id = ?`,
        [show.id]
      );
      show.genres = showGenres;
    }

    res.json({
      shows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err: any) {
    console.error('Error in GET /api/shows:', err);
    res.status(500).json({ error: 'Failed to retrieve shows' });
  }
});

// 2. GET /api/shows/:slug
router.get('/shows/:slug', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const slug = req.params.slug;

    const show = queryOne(
      db,
      `SELECT * FROM tv_shows WHERE slug = ? AND is_published = 1`,
      [slug]
    );

    if (!show) {
      res.status(404).json({ error: 'TV Show not found' });
      return;
    }

    // Increment view count asynchronously
    execute(db, "UPDATE tv_shows SET view_count = view_count + 1 WHERE id = ?", [show.id]);

    // Fetch genres
    const genres = queryAll(
      db,
      `SELECT g.id, g.name, g.slug, g.description FROM genres g
       JOIN tv_show_genres tsg ON g.id = tsg.genre_id
       WHERE tsg.tv_show_id = ?`,
      [show.id]
    );
    show.genres = genres;

    // Fetch published seasons
    const seasons = queryAll(
      db,
      `SELECT * FROM seasons WHERE tv_show_id = ? AND is_published = 1 ORDER BY season_number ASC`,
      [show.id]
    );

    // Fetch published episodes for all seasons
    for (const season of seasons) {
      const episodes = queryAll(
        db,
        `SELECT * FROM episodes WHERE season_id = ? AND is_published = 1 ORDER BY episode_number ASC`,
        [season.id]
      );
      season.episodes = episodes;
    }
    show.seasons = seasons;

    // Fetch related shows based on shared genres
    let related: any[] = [];
    if (genres.length > 0) {
      const genreIds = genres.map(g => `'${g.id}'`).join(',');
      related = queryAll(
        db,
        `SELECT DISTINCT s.id, s.title, s.slug, s.release_year, s.imdb_rating, s.poster_url, s.status, s.seasons_count
         FROM tv_shows s
         JOIN tv_show_genres tsg ON s.id = tsg.tv_show_id
         WHERE tsg.genre_id IN (${genreIds}) AND s.id != ? AND s.is_published = 1
         LIMIT 6`,
        [show.id]
      );
    }
    show.related = related;

    res.json(show);
  } catch (err: any) {
    console.error('Error in GET /api/shows/:slug:', err);
    res.status(500).json({ error: 'Failed to retrieve show details' });
  }
});

// 3. GET /api/shows/:slug/seasons
router.get('/shows/:slug/seasons', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const show = queryOne(db, "SELECT id FROM tv_shows WHERE slug = ? AND is_published = 1", [req.params.slug]);
    if (!show) {
      res.status(404).json({ error: 'Show not found' });
      return;
    }

    const seasons = queryAll(
      db,
      "SELECT * FROM seasons WHERE tv_show_id = ? AND is_published = 1 ORDER BY season_number ASC",
      [show.id]
    );
    res.json(seasons);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch seasons' });
  }
});

// 4. GET /api/shows/:slug/episodes
router.get('/shows/:slug/episodes', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const show = queryOne(db, "SELECT id FROM tv_shows WHERE slug = ? AND is_published = 1", [req.params.slug]);
    if (!show) {
      res.status(404).json({ error: 'Show not found' });
      return;
    }

    const seasonNum = req.query.season ? parseInt(req.query.season as string) : null;
    let sql = "SELECT * FROM episodes WHERE tv_show_id = ? AND is_published = 1";
    let params: any[] = [show.id];

    if (seasonNum) {
      sql += " AND season_number = ?";
      params.push(seasonNum);
    }

    sql += " ORDER BY season_number ASC, episode_number ASC";
    const episodes = queryAll(db, sql, params);
    res.json(episodes);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
});

// 5. GET /api/genres
router.get('/genres', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const genres = queryAll(
      db,
      `SELECT g.id, g.name, g.slug, g.description, COUNT(tsg.tv_show_id) as show_count
       FROM genres g
       LEFT JOIN tv_show_genres tsg ON g.id = tsg.genre_id
       LEFT JOIN tv_shows s ON tsg.tv_show_id = s.id AND s.is_published = 1
       GROUP BY g.id
       ORDER BY g.name ASC`
    );
    res.json(genres);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

// 6. GET /api/search
router.get('/search', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const query = (req.query.q as string || '').trim();
    if (!query || query.length < 2) {
      res.json([]);
      return;
    }

    const term = `%${query}%`;
    const results = queryAll(
      db,
      `SELECT s.id, s.title, s.slug, s.release_year, s.imdb_rating, s.poster_url, s.overview, s.status, s.seasons_count
       FROM tv_shows s
       WHERE s.is_published = 1 AND (s.title LIKE ? OR s.original_title LIKE ? OR s.cast_members LIKE ? OR s.overview LIKE ?)
       ORDER BY s.imdb_rating DESC, s.view_count DESC
       LIMIT 10`,
      [term, term, term, term]
    );

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// 7. GET /api/settings/public
router.get('/settings/public', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const rows = queryAll<{ key: string; value: string }>(db, "SELECT key, value FROM site_settings");
    const settings: Record<string, string> = {};
    for (const r of rows) {
      // Exclude internal keys
      if (!r.key.includes('secret') && !r.key.includes('token')) {
        settings[r.key] = r.value;
      }
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// 8. Dynamic XML Sitemap & Robots.txt
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    const shows = queryAll<{ slug: string; updated_at: string }>(
      db,
      "SELECT slug, updated_at FROM tv_shows WHERE is_published = 1 ORDER BY updated_at DESC"
    );

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/shows</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

    for (const s of shows) {
      const date = s.updated_at ? s.updated_at.split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/tv-show/${s.slug}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err: any) {
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const content = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.send(content);
});

// -----------------------------------------------------------------------------
// ADMIN AUTHENTICATION ENDPOINTS
// -----------------------------------------------------------------------------

// Check if first-time admin setup is required
router.get('/admin/setup-status', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const count = countAdmins(db);
    res.json({ needsSetup: count === 0, adminCount: count });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
});

// One-time Initial Admin Setup
router.post('/admin/setup', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const count = countAdmins(db);

    if (count > 0) {
      res.status(403).json({ error: 'Initial administrator already exists. Please login instead.' });
      return;
    }

    const { email, password, display_name } = req.body;

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'A valid email address is required.' });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const name = (display_name || '').trim() || 'System Administrator';
    const passwordHash = await hashPassword(password);
    const adminId = generateId('adm');
    const now = new Date().toISOString();

    execute(
      db,
      "INSERT INTO admins (id, email, password_hash, display_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [adminId, email.toLowerCase().trim(), passwordHash, name, 'superadmin', now, now]
    );

    // Auto-login session
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    const token = createSession(db, adminId, ip, userAgent);

    res.cookie('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      user: {
        id: adminId,
        email: email.toLowerCase().trim(),
        display_name: name,
        role: 'superadmin'
      }
    });
  } catch (err: any) {
    console.error('Error in /api/admin/setup:', err);
    res.status(500).json({ error: 'Failed to complete administrator setup' });
  }
});

// Secure Admin Login with Rate Limiting
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const ip = getClientIp(req);

    // Check rate limit (max 5 failed attempts in 15 mins)
    const rateCheck = checkRateLimit(db, ip);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: `Too many failed login attempts. Account temporarily locked for security. Please retry in ${rateCheck.retryAfterSec} seconds.`,
        retryAfter: rateCheck.retryAfterSec
      });
      return;
    }

    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const admin = queryOne<{ id: string; email: string; password_hash: string; display_name: string; role: string }>(
      db,
      "SELECT id, email, password_hash, display_name, role FROM admins WHERE email = ?",
      [email.toLowerCase().trim()]
    );

    if (!admin) {
      recordFailedAttempt(db, ip);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const validPassword = await comparePassword(password, admin.password_hash);
    if (!validPassword) {
      recordFailedAttempt(db, ip);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Success: clear failed rate limiting attempts
    clearFailedAttempts(db, ip);

    const userAgent = req.headers['user-agent'];
    const token = createSession(db, admin.id, ip, userAgent);

    res.cookie('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        display_name: admin.display_name,
        role: admin.role
      }
    });
  } catch (err: any) {
    console.error('Error in /api/admin/login:', err);
    res.status(500).json({ error: 'Internal login error' });
  }
});

// Admin Logout
router.post('/admin/logout', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    let token = req.cookies?.admin_session;
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (token) {
      deleteSession(db, token);
    }

    res.clearCookie('admin_session');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Check Current Admin Session
router.get('/admin/me', requireAdmin, async (req: Request, res: Response) => {
  res.json({ user: (req as any).admin });
});

// Change Password
router.post('/admin/change-password', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const adminUser = (req as any).admin as AdminUser;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const admin = queryOne<{ password_hash: string }>(
      db,
      "SELECT password_hash FROM admins WHERE id = ?",
      [adminUser.id]
    );

    if (!admin) {
      res.status(404).json({ error: 'Admin record not found' });
      return;
    }

    const matches = await comparePassword(currentPassword, admin.password_hash);
    if (!matches) {
      res.status(400).json({ error: 'Current password does not match.' });
      return;
    }

    const newHash = await hashPassword(newPassword);
    execute(
      db,
      "UPDATE admins SET password_hash = ?, updated_at = ? WHERE id = ?",
      [newHash, new Date().toISOString(), adminUser.id]
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// -----------------------------------------------------------------------------
// PROTECTED ADMIN CONTENT MANAGEMENT
// -----------------------------------------------------------------------------

// Dashboard Statistics
router.get('/admin/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();

    const totalShows = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM tv_shows")?.c || 0;
    const publishedShows = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM tv_shows WHERE is_published = 1")?.c || 0;
    const draftShows = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM tv_shows WHERE is_published = 0")?.c || 0;
    const totalSeasons = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM seasons")?.c || 0;
    const totalEpisodes = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM episodes")?.c || 0;

    const recentlyUpdated = queryAll(
      db,
      `SELECT id, title, slug, is_published, imdb_rating, updated_at
       FROM tv_shows
       ORDER BY updated_at DESC
       LIMIT 5`
    );

    res.json({
      totalShows,
      publishedShows,
      draftShows,
      totalSeasons,
      totalEpisodes,
      recentlyUpdated
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compute dashboard statistics' });
  }
});

// Admin All Shows List (Includes Drafts, Filters, Pagination)
router.get('/admin/shows', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const search = (req.query.search as string || '').trim();
    const status = (req.query.status as string || '').trim();
    const publication = req.query.publication as string;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (search) {
      whereClauses.push('(title LIKE ? OR slug LIKE ? OR cast_members LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    if (publication === 'published') {
      whereClauses.push('is_published = 1');
    } else if (publication === 'draft') {
      whereClauses.push('is_published = 0');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countRes = queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM tv_shows ${whereSql}`, params);
    const total = countRes ? countRes.count : 0;

    const querySql = `
      SELECT id, title, slug, original_title, release_year, end_year, status, imdb_rating,
             seasons_count, episodes_count, poster_url, is_featured, is_trending, is_published,
             view_count, created_at, updated_at
      FROM tv_shows
      ${whereSql}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const shows = queryAll(db, querySql, [...params, limit, offset]);

    for (const show of shows) {
      const genres = queryAll(
        db,
        `SELECT g.id, g.name, g.slug FROM genres g
         JOIN tv_show_genres tsg ON g.id = tsg.genre_id
         WHERE tsg.tv_show_id = ?`,
        [show.id]
      );
      show.genres = genres;
    }

    res.json({
      shows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list admin shows' });
  }
});

// Admin Show Details by ID (for Editing)
router.get('/admin/shows/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const show = queryOne(db, "SELECT * FROM tv_shows WHERE id = ?", [req.params.id]);
    if (!show) {
      res.status(404).json({ error: 'TV Show not found' });
      return;
    }

    // Attach genres
    const genres = queryAll(
      db,
      `SELECT g.id, g.name, g.slug FROM genres g
       JOIN tv_show_genres tsg ON g.id = tsg.genre_id
       WHERE tsg.tv_show_id = ?`,
      [show.id]
    );
    show.genres = genres;

    // Attach seasons with episodes
    const seasons = queryAll(
      db,
      "SELECT * FROM seasons WHERE tv_show_id = ? ORDER BY season_number ASC",
      [show.id]
    );

    for (const season of seasons) {
      const episodes = queryAll(
        db,
        "SELECT * FROM episodes WHERE season_id = ? ORDER BY episode_number ASC",
        [season.id]
      );
      season.episodes = episodes;
    }
    show.seasons = seasons;

    res.json(show);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch show' });
  }
});

// Admin Create New Show
router.post('/admin/shows', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const body = req.body;

    if (!body.title || !body.title.trim()) {
      res.status(400).json({ error: 'Series title is required' });
      return;
    }

    let slug = body.slug ? slugify(body.slug) : slugify(body.title);
    if (!slug) slug = `show-${Date.now()}`;

    // Verify slug uniqueness
    const existing = queryOne(db, "SELECT id FROM tv_shows WHERE slug = ?", [slug]);
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const id = generateId('show');
    const now = new Date().toISOString();
    const releaseYear = parseInt(body.release_year) || new Date().getFullYear();
    const endYear = body.end_year ? parseInt(body.end_year) : null;
    const imdbRating = parseFloat(body.imdb_rating) || 0.0;
    const isFeatured = body.is_featured ? 1 : 0;
    const isTrending = body.is_trending ? 1 : 0;
    const isPublished = body.is_published ? 1 : 0;

    execute(
      db,
      `INSERT INTO tv_shows (
        id, title, slug, original_title, overview, full_description, release_year, end_year,
        status, country, language, imdb_rating, seasons_count, episodes_count, cast_members,
        director, creator, poster_url, backdrop_url, youtube_trailer_id, seo_title,
        seo_meta_description, keywords, is_featured, is_trending, is_published, view_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, body.title.trim(), slug, body.original_title || body.title.trim(),
        body.overview || '', body.full_description || '', releaseYear, endYear,
        body.status || 'Ongoing', body.country || 'United States', body.language || 'English',
        imdbRating, 0, 0, body.cast_members || '', body.director || '', body.creator || '',
        body.poster_url || '', body.backdrop_url || '', body.youtube_trailer_id || '',
        body.seo_title || body.title.trim(), body.seo_meta_description || body.overview || '',
        body.keywords || '', isFeatured, isTrending, isPublished, 0, now, now
      ]
    );

    // Save genre associations
    if (Array.isArray(body.genre_ids)) {
      for (const genreId of body.genre_ids) {
        execute(db, "INSERT INTO tv_show_genres (tv_show_id, genre_id) VALUES (?, ?)", [id, genreId]);
      }
    }

    res.status(201).json({ success: true, id, slug });
  } catch (err: any) {
    console.error('Error creating show:', err);
    res.status(500).json({ error: 'Failed to create show' });
  }
});

// Admin Update Show
router.put('/admin/shows/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const body = req.body;

    const existing = queryOne(db, "SELECT id FROM tv_shows WHERE id = ?", [id]);
    if (!existing) {
      res.status(404).json({ error: 'TV Show not found' });
      return;
    }

    let slug = body.slug ? slugify(body.slug) : slugify(body.title);
    // Check if new slug belongs to another show
    const duplicate = queryOne(db, "SELECT id FROM tv_shows WHERE slug = ? AND id != ?", [slug, id]);
    if (duplicate) {
      res.status(400).json({ error: `Slug "${slug}" is already in use by another TV series.` });
      return;
    }

    const now = new Date().toISOString();
    const releaseYear = parseInt(body.release_year) || new Date().getFullYear();
    const endYear = body.end_year ? parseInt(body.end_year) : null;
    const imdbRating = parseFloat(body.imdb_rating) || 0.0;
    const isFeatured = body.is_featured ? 1 : 0;
    const isTrending = body.is_trending ? 1 : 0;
    const isPublished = body.is_published ? 1 : 0;

    execute(
      db,
      `UPDATE tv_shows SET
        title = ?, slug = ?, original_title = ?, overview = ?, full_description = ?,
        release_year = ?, end_year = ?, status = ?, country = ?, language = ?,
        imdb_rating = ?, cast_members = ?, director = ?, creator = ?, poster_url = ?,
        backdrop_url = ?, youtube_trailer_id = ?, seo_title = ?, seo_meta_description = ?,
        keywords = ?, is_featured = ?, is_trending = ?, is_published = ?, updated_at = ?
      WHERE id = ?`,
      [
        body.title.trim(), slug, body.original_title || body.title.trim(),
        body.overview || '', body.full_description || '', releaseYear, endYear,
        body.status || 'Ongoing', body.country || 'United States', body.language || 'English',
        imdbRating, body.cast_members || '', body.director || '', body.creator || '',
        body.poster_url || '', body.backdrop_url || '', body.youtube_trailer_id || '',
        body.seo_title || '', body.seo_meta_description || '', body.keywords || '',
        isFeatured, isTrending, isPublished, now, id
      ]
    );

    // Update genres
    if (Array.isArray(body.genre_ids)) {
      execute(db, "DELETE FROM tv_show_genres WHERE tv_show_id = ?", [id]);
      for (const genreId of body.genre_ids) {
        execute(db, "INSERT INTO tv_show_genres (tv_show_id, genre_id) VALUES (?, ?)", [id, genreId]);
      }
    }

    // Refresh seasons/episodes count
    const seasonsCount = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM seasons WHERE tv_show_id = ?", [id])?.c || 0;
    const episodesCount = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM episodes WHERE tv_show_id = ?", [id])?.c || 0;
    execute(db, "UPDATE tv_shows SET seasons_count = ?, episodes_count = ? WHERE id = ?", [seasonsCount, episodesCount, id]);

    res.json({ success: true, id, slug });
  } catch (err: any) {
    console.error('Error updating show:', err);
    res.status(500).json({ error: 'Failed to update show' });
  }
});

// Admin Delete Show
router.delete('/admin/shows/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;

    // With ON DELETE CASCADE, seasons, episodes, and tv_show_genres will be deleted safely
    execute(db, "DELETE FROM tv_shows WHERE id = ?", [id]);
    res.json({ success: true, message: 'TV Show deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete show' });
  }
});

// -----------------------------------------------------------------------------
// SEASONS MANAGEMENT
// -----------------------------------------------------------------------------

router.get('/admin/shows/:showId/seasons', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const seasons = queryAll(
      db,
      "SELECT * FROM seasons WHERE tv_show_id = ? ORDER BY season_number ASC",
      [req.params.showId]
    );
    res.json(seasons);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch seasons' });
  }
});

router.post('/admin/seasons', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const { tv_show_id, season_number, title, overview, poster_url, release_date, is_published } = req.body;

    if (!tv_show_id || !season_number) {
      res.status(400).json({ error: 'TV Show ID and season number are required.' });
      return;
    }

    const sNum = parseInt(season_number);
    const existing = queryOne(
      db,
      "SELECT id FROM seasons WHERE tv_show_id = ? AND season_number = ?",
      [tv_show_id, sNum]
    );
    if (existing) {
      res.status(400).json({ error: `Season ${sNum} already exists for this TV series.` });
      return;
    }

    const id = generateId('sea');
    const now = new Date().toISOString();

    execute(
      db,
      `INSERT INTO seasons (
        id, tv_show_id, season_number, title, overview, poster_url, release_date,
        episode_count, display_order, is_published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tv_show_id, sNum, title || `Season ${sNum}`, overview || '', poster_url || '',
        release_date || '', 0, sNum, is_published ? 1 : 0, now, now
      ]
    );

    // Update seasons_count on tv_show
    const seasonsCount = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM seasons WHERE tv_show_id = ?", [tv_show_id])?.c || 0;
    execute(db, "UPDATE tv_shows SET seasons_count = ?, updated_at = ? WHERE id = ?", [seasonsCount, now, tv_show_id]);

    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create season' });
  }
});

router.put('/admin/seasons/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const { season_number, title, overview, poster_url, release_date, is_published, display_order } = req.body;

    const season = queryOne<{ tv_show_id: string }>(db, "SELECT tv_show_id FROM seasons WHERE id = ?", [id]);
    if (!season) {
      res.status(404).json({ error: 'Season not found' });
      return;
    }

    const sNum = parseInt(season_number);
    const now = new Date().toISOString();

    execute(
      db,
      `UPDATE seasons SET
        season_number = ?, title = ?, overview = ?, poster_url = ?, release_date = ?,
        display_order = ?, is_published = ?, updated_at = ?
      WHERE id = ?`,
      [sNum, title, overview || '', poster_url || '', release_date || '', display_order || sNum, is_published ? 1 : 0, now, id]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update season' });
  }
});

router.delete('/admin/seasons/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const season = queryOne<{ tv_show_id: string }>(db, "SELECT tv_show_id FROM seasons WHERE id = ?", [id]);

    execute(db, "DELETE FROM seasons WHERE id = ?", [id]);

    if (season) {
      const now = new Date().toISOString();
      const seasonsCount = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM seasons WHERE tv_show_id = ?", [season.tv_show_id])?.c || 0;
      const episodesCount = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM episodes WHERE tv_show_id = ?", [season.tv_show_id])?.c || 0;
      execute(db, "UPDATE tv_shows SET seasons_count = ?, episodes_count = ?, updated_at = ? WHERE id = ?", [seasonsCount, episodesCount, now, season.tv_show_id]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete season' });
  }
});

// -----------------------------------------------------------------------------
// EPISODES MANAGEMENT
// -----------------------------------------------------------------------------

router.get('/admin/seasons/:seasonId/episodes', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const episodes = queryAll(
      db,
      "SELECT * FROM episodes WHERE season_id = ? ORDER BY episode_number ASC",
      [req.params.seasonId]
    );
    res.json(episodes);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
});

router.post('/admin/episodes', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const {
      season_id, episode_number, title, description, thumbnail_url,
      release_date, runtime_minutes, video_source_type, video_url,
      external_watch_link, download_link, is_published, display_order
    } = req.body;

    const season = queryOne<{ tv_show_id: string; season_number: number }>(
      db,
      "SELECT tv_show_id, season_number FROM seasons WHERE id = ?",
      [season_id]
    );

    if (!season) {
      res.status(404).json({ error: 'Season not found' });
      return;
    }

    const epNum = parseInt(episode_number);
    const existing = queryOne(
      db,
      "SELECT id FROM episodes WHERE season_id = ? AND episode_number = ?",
      [season_id, epNum]
    );

    if (existing) {
      res.status(400).json({ error: `Episode ${epNum} already exists in this season.` });
      return;
    }

    const id = generateId('ep');
    const now = new Date().toISOString();

    execute(
      db,
      `INSERT INTO episodes (
        id, season_id, tv_show_id, episode_number, season_number, title, description,
        thumbnail_url, release_date, runtime_minutes, video_source_type, video_url,
        external_watch_link, download_link, display_order, is_published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, season_id, season.tv_show_id, epNum, season.season_number, title || `Episode ${epNum}`,
        description || '', thumbnail_url || '', release_date || '', parseInt(runtime_minutes) || 45,
        video_source_type || 'embed', video_url || '', external_watch_link || '', download_link || '',
        display_order || epNum, is_published ? 1 : 0, now, now
      ]
    );

    // Update season episode count & show episodes count
    const seasonEpCount = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM episodes WHERE season_id = ?", [season_id])?.c || 0;
    execute(db, "UPDATE seasons SET episode_count = ?, updated_at = ? WHERE id = ?", [seasonEpCount, now, season_id]);

    const showEpCount = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM episodes WHERE tv_show_id = ?", [season.tv_show_id])?.c || 0;
    execute(db, "UPDATE tv_shows SET episodes_count = ?, updated_at = ? WHERE id = ?", [showEpCount, now, season.tv_show_id]);

    res.status(201).json({ success: true, id });
  } catch (err: any) {
    console.error('Error creating episode:', err);
    res.status(500).json({ error: 'Failed to create episode' });
  }
});

router.put('/admin/episodes/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const {
      episode_number, title, description, thumbnail_url, release_date,
      runtime_minutes, video_source_type, video_url, external_watch_link,
      download_link, is_published, display_order
    } = req.body;

    const ep = queryOne<{ season_id: string; tv_show_id: string }>(db, "SELECT season_id, tv_show_id FROM episodes WHERE id = ?", [id]);
    if (!ep) {
      res.status(404).json({ error: 'Episode not found' });
      return;
    }

    const epNum = parseInt(episode_number);
    const now = new Date().toISOString();

    execute(
      db,
      `UPDATE episodes SET
        episode_number = ?, title = ?, description = ?, thumbnail_url = ?,
        release_date = ?, runtime_minutes = ?, video_source_type = ?, video_url = ?,
        external_watch_link = ?, download_link = ?, display_order = ?, is_published = ?, updated_at = ?
      WHERE id = ?`,
      [
        epNum, title, description || '', thumbnail_url || '', release_date || '',
        parseInt(runtime_minutes) || 45, video_source_type || 'embed', video_url || '',
        external_watch_link || '', download_link || '', display_order || epNum,
        is_published ? 1 : 0, now, id
      ]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update episode' });
  }
});

router.delete('/admin/episodes/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const ep = queryOne<{ season_id: string; tv_show_id: string }>(db, "SELECT season_id, tv_show_id FROM episodes WHERE id = ?", [id]);

    execute(db, "DELETE FROM episodes WHERE id = ?", [id]);

    if (ep) {
      const now = new Date().toISOString();
      const seasonEpCount = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM episodes WHERE season_id = ?", [ep.season_id])?.c || 0;
      execute(db, "UPDATE seasons SET episode_count = ?, updated_at = ? WHERE id = ?", [seasonEpCount, now, ep.season_id]);

      const showEpCount = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM episodes WHERE tv_show_id = ?", [ep.tv_show_id])?.c || 0;
      execute(db, "UPDATE tv_shows SET episodes_count = ?, updated_at = ? WHERE id = ?", [showEpCount, now, ep.tv_show_id]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete episode' });
  }
});

// -----------------------------------------------------------------------------
// GENRES CRUD
// -----------------------------------------------------------------------------

router.get('/admin/genres', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const genres = queryAll(
      db,
      `SELECT g.id, g.name, g.slug, g.description, COUNT(tsg.tv_show_id) as show_count
       FROM genres g
       LEFT JOIN tv_show_genres tsg ON g.id = tsg.genre_id
       GROUP BY g.id
       ORDER BY g.name ASC`
    );
    res.json(genres);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

router.post('/admin/genres', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const { name, slug, description } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Genre name is required' });
      return;
    }

    const genSlug = slug ? slugify(slug) : slugify(name);
    const existing = queryOne(db, "SELECT id FROM genres WHERE slug = ? OR name = ?", [genSlug, name.trim()]);
    if (existing) {
      res.status(400).json({ error: 'A genre with this name or slug already exists' });
      return;
    }

    const id = generateId('genre');
    execute(
      db,
      "INSERT INTO genres (id, name, slug, description) VALUES (?, ?, ?, ?)",
      [id, name.trim(), genSlug, description || '']
    );

    res.status(201).json({ success: true, id, name: name.trim(), slug: genSlug });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create genre' });
  }
});

router.delete('/admin/genres/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    execute(db, "DELETE FROM genres WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete genre' });
  }
});

// -----------------------------------------------------------------------------
// SITE SETTINGS
// -----------------------------------------------------------------------------

router.get('/admin/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const rows = queryAll<{ key: string; value: string; updated_at: string }>(db, "SELECT * FROM site_settings");
    const settings: Record<string, string> = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.put('/admin/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const updates = req.body;
    const now = new Date().toISOString();

    for (const [key, value] of Object.entries(updates)) {
      const existing = queryOne(db, "SELECT key FROM site_settings WHERE key = ?", [key]);
      if (existing) {
        execute(db, "UPDATE site_settings SET value = ?, updated_at = ? WHERE key = ?", [String(value), now, key]);
      } else {
        execute(db, "INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)", [key, String(value), now]);
      }
    }

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// -----------------------------------------------------------------------------
// MEDIA UPLOAD & R2 SIMULATION / STORAGE
// -----------------------------------------------------------------------------

router.post('/admin/upload', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { url, filename, base64Data } = req.body;

    // Check if user is passing an image URL directly
    if (url && typeof url === 'string') {
      res.json({ success: true, url });
      return;
    }

    // If client sends base64 image data
    if (base64Data && typeof base64Data === 'string') {
      const allowedPrefixes = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,'];
      const isValid = allowedPrefixes.some(p => base64Data.startsWith(p));
      if (!isValid && !base64Data.startsWith('data:image/')) {
        res.status(400).json({ error: 'Invalid image format. Allowed formats: JPEG, PNG, WebP.' });
        return;
      }

      // Check max size (approx 5MB base64)
      if (base64Data.length > 7 * 1024 * 1024) {
        res.status(400).json({ error: 'File size exceeds maximum allowed upload size (5MB).' });
        return;
      }

      // Return persistent media URL
      res.json({
        success: true,
        url: base64Data,
        storageKey: `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        source: 'stored'
      });
      return;
    }

    res.status(400).json({ error: 'No valid URL or image payload provided.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// -----------------------------------------------------------------------------
// ONE-CLICK DEMO SEED ACTION
// -----------------------------------------------------------------------------

router.post('/admin/seed-demo', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const result = seedDemoData(db);
    res.json(result);
  } catch (err: any) {
    console.error('Error seeding demo data:', err);
    res.status(500).json({ error: 'Failed to seed demo data' });
  }
});
