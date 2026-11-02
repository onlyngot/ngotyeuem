import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'site_configuration.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Support large payloads for base64 avatars, custom backgrounds, and playlist covers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to read current configuration from disk
function readConfig(): Record<string, any> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading site config:', err);
  }
  return { lastUpdated: 0 };
}

// Helper to write configuration to disk
function writeConfig(data: Record<string, any>): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing site config:', err);
  }
}

// -------------------------------------------------------------
// REST API: Automated Cross-Device Interface Synchronization
// -------------------------------------------------------------

// 1. Get current site configuration for all devices
app.get('/api/site-config', (req, res) => {
  const config = readConfig();
  res.json({
    success: true,
    config,
    lastUpdated: config.lastUpdated || 0,
  });
});

// 2. Lightweight version poll check for other devices
app.get('/api/site-config/version', (req, res) => {
  const config = readConfig();
  res.json({
    success: true,
    lastUpdated: config.lastUpdated || 0,
  });
});

// 3. Save / Update site configuration from Admin
app.post('/api/site-config', (req, res) => {
  try {
    const incoming = req.body || {};
    const current = readConfig();
    const updated = {
      ...current,
      ...incoming,
      lastUpdated: Date.now(),
    };
    writeConfig(updated);
    res.json({
      success: true,
      lastUpdated: updated.lastUpdated,
      message: 'Giao diện đã được lưu và đồng bộ tự động tới mọi thiết bị!',
    });
  } catch (err) {
    console.error('Failed to save config:', err);
    res.status(500).json({ success: false, error: 'Failed to update config' });
  }
});

// -------------------------------------------------------------
// Vite Server Integration (Vite middlewares in dev / static in prod)
// -------------------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Yimeo Server] Running on http://0.0.0.0:${PORT} with cross-device sync active.`);
  });
}

start();
