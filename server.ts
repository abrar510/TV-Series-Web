import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { router as apiRouter } from './server/routes.js';
import { getDatabase } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Pre-initialize SQLite Database
  try {
    await getDatabase();
    console.log('✅ SQLite database initialized and ready.');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  // Mount API Router
  app.use('/api', apiRouter);

  // Fallback for robots.txt and sitemap.xml directly on root
  app.get('/sitemap.xml', (req, res, next) => {
    req.url = '/api/sitemap.xml';
    app._router.handle(req, res, next);
  });

  app.get('/robots.txt', (req, res, next) => {
    req.url = '/api/robots.txt';
    app._router.handle(req, res, next);
  });

  // Vite Middleware in Dev or Static in Production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 Spectra TV Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
