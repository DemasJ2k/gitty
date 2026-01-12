import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import routes from './routes.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// API routes
app.use('/api', routes);

async function startServer() {
  if (isDev) {
    // Development: Use Vite middleware
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files
    app.use(express.static(join(__dirname, '../dist')));
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, '../dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Mode: ${isDev ? 'development' : 'production'}`);
  });
}

startServer();
