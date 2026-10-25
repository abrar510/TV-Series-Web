import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { seedDemoData } from './seed.js';

let dbInstance: SqlJsDatabase | null = null;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.sqlite');
const MIGRATION_FILE = path.resolve(process.cwd(), 'migrations', '0001_initial_schema.sql');

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Error loading existing sqlite file, creating fresh database:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Execute migration schema
  if (fs.existsSync(MIGRATION_FILE)) {
    const migrationSql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    dbInstance.run(migrationSql);
  }

  // Seed default genres if empty
  seedDefaults(dbInstance);

  saveDatabase();
  return dbInstance;
}

export function saveDatabase(): void {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

function seedDefaults(db: SqlJsDatabase): void {
  // Check if genres exist
  const res = db.exec("SELECT COUNT(*) as count FROM genres");
  const count = res[0]?.values[0]?.[0] as number;

  if (count === 0) {
    const defaultGenres = [
      { id: 'genre-action', name: 'Action', slug: 'action', description: 'High-octane excitement and combat' },
      { id: 'genre-drama', name: 'Drama', slug: 'drama', description: 'Intense narrative and human conflict' },
      { id: 'genre-scifi', name: 'Sci-Fi', slug: 'sci-fi', description: 'Futuristic concepts and interstellar journeys' },
      { id: 'genre-crime', name: 'Crime', slug: 'crime', description: 'Detectives, heists, syndicates and mysteries' },
      { id: 'genre-thriller', name: 'Thriller', slug: 'thriller', description: 'Suspenseful and psychological intrigue' },
      { id: 'genre-fantasy', name: 'Fantasy', slug: 'fantasy', description: 'Mythical realms, magic, and epic lore' },
      { id: 'genre-comedy', name: 'Comedy', slug: 'comedy', description: 'Humor, satire, and lighthearted entertainment' },
      { id: 'genre-mystery', name: 'Mystery', slug: 'mystery', description: 'Puzzles, secrets, and investigations' },
    ];

    for (const g of defaultGenres) {
      db.run("INSERT INTO genres (id, name, slug, description) VALUES (?, ?, ?, ?)", [g.id, g.name, g.slug, g.description]);
    }
  }

  // Check default site settings
  const settingsRes = db.exec("SELECT COUNT(*) as count FROM site_settings");
  const settingsCount = settingsRes[0]?.values[0]?.[0] as number;

  if (settingsCount === 0) {
    const now = new Date().toISOString();
    const defaultSettings: Record<string, string> = {
      site_name: 'Spectra TV',
      site_tagline: 'Prestige TV Series & Episodes Catalog',
      site_description: 'Streamlined discovery for modern television series, seasons, trailers, and episode guides.',
      contact_email: 'contact@spectratv.com',
      footer_text: '© 2026 Spectra TV Catalog. All rights reserved. Cloudflare D1 & Workers Architecture.',
      r2_bucket_name: 'tv-catalog-media',
      r2_public_domain: '',
      enable_downloads: 'true',
      default_trailer_youtube_id: 'HhesaQXLuRY',
      primary_accent_color: '#e11d48'
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      db.run("INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)", [key, value, now]);
    }
  }

  // Pre-seed sample high-fidelity TV series catalog
  seedDemoData(db);
}

// Helper query wrappers for clean SQLite operations with parameterized bindings
export function queryAll<T = any>(db: SqlJsDatabase, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    return results;
  } finally {
    stmt.free();
  }
}

export function queryOne<T = any>(db: SqlJsDatabase, sql: string, params: any[] = []): T | null {
  const results = queryAll<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

export function execute(db: SqlJsDatabase, sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDatabase();
}
