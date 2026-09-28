import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT, 10) || 5000;
const ROOT = fs.existsSync(path.join(__dirname, 'dist')) 
  ? path.join(__dirname, 'dist') 
  : __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error: ' + err.message);
      }
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
}

// Proxy helper for Python backend at http://localhost:8000
function proxyToPythonBackend(req, res) {
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Python backend unavailable', details: err.message }));
  });

  req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  // If API route, forward to Python backend
  if (req.url.startsWith('/api/')) {
    proxyToPythonBackend(req, res);
    return;
  }

  // Normalize URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Prevent directory traversal
  let safePath = path.normalize(path.join(ROOT, pathname));
  if (!safePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // If directory, check index.html
  fs.stat(safePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      safePath = path.join(safePath, 'index.html');
    }

    fs.stat(safePath, (fileErr, fileStats) => {
      if (!fileErr && fileStats.isFile()) {
        serveFile(res, safePath);
      } else {
        // Fallback to index.html for SPA routing if requested resource is not an asset
        if (!pathname.includes('.')) {
          serveFile(res, path.join(ROOT, 'index.html'));
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        }
      }
    });
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`  RetinaCare AI Clinical Platform Server Active`);
    console.log(`  Production / Proxy URL: http://localhost:${port}`);
    console.log(`======================================================\n`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
