/**
 * Cloudflare Worker & Cloudflare Pages Functions Entry Point
 * Designed for Cloudflare D1 (SQLite) and Cloudflare R2 bindings.
 */

export interface D1Database {
  prepare(query: string): {
    bind(...params: any[]): {
      all(): Promise<{ results: any[] }>;
      first(): Promise<any>;
      run(): Promise<{ success: boolean; meta: any }>;
    };
  };
  batch(statements: any[]): Promise<any[]>;
  exec(query: string): Promise<any>;
}

export interface R2Bucket {
  get(key: string): Promise<any>;
  put(key: string, value: any): Promise<any>;
  delete(key: string): Promise<any>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  DB?: D1Database;
  MEDIA_BUCKET?: R2Bucket;
  ENVIRONMENT?: string;
  ADMIN_SESSION_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if D1 database binding exists
    const checkDb = () => {
      if (!env.DB) {
        return new Response(
          JSON.stringify({
            error: "D1 database binding 'DB' is not configured yet.",
            instruction: "In Cloudflare Dashboard, go to Workers & Pages > Settings > Bindings and bind your D1 database to variable name 'DB'."
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return null;
    };

    // Public API: GET /api/shows
    if (pathname === '/api/shows' && request.method === 'GET') {
      const dbErr = checkDb();
      if (dbErr) return dbErr;

      try {
        const search = url.searchParams.get('search') || '';
        const genre = url.searchParams.get('genre') || '';
        const status = url.searchParams.get('status') || '';
        const sort = url.searchParams.get('sort') || 'newest';
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '18')));
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM tv_shows WHERE is_published = 1';
        const params: any[] = [];

        if (search) {
          query += ' AND (title LIKE ? OR overview LIKE ?)';
          params.push(`%${search}%`, `%${search}%`);
        }
        if (status) {
          query += ' AND status = ?';
          params.push(status);
        }

        if (sort === 'rating') {
          query += ' ORDER BY imdb_rating DESC';
        } else if (sort === 'title') {
          query += ' ORDER BY title ASC';
        } else {
          query += ' ORDER BY created_at DESC';
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const stmt = env.DB!.prepare(query);
        const { results } = await stmt.bind(...params).all();

        return new Response(JSON.stringify({ shows: results, page, limit }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // Public API: GET /api/shows/:slug
    if (pathname.startsWith('/api/shows/') && request.method === 'GET') {
      const dbErr = checkDb();
      if (dbErr) return dbErr;

      const slug = pathname.replace('/api/shows/', '');
      const show = await env.DB!.prepare('SELECT * FROM tv_shows WHERE slug = ? AND is_published = 1')
        .bind(slug)
        .first();

      if (!show) {
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
      }

      const seasons = await env.DB!.prepare('SELECT * FROM seasons WHERE tv_show_id = ? AND is_published = 1 ORDER BY season_number ASC')
        .bind((show as any).id)
        .all();

      return new Response(JSON.stringify({ ...show, seasons: seasons.results }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pass through to static assets / Pages router
    return new Response('Spectra TV Cloudflare API Worker running', { status: 200 });
  },
};
