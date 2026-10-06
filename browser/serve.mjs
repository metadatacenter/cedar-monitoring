// Serves the built Monitoring, with every unknown path answered by index.html as the deployed
// server does, so a route such as /resource-counts/opensearch loads the application.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../cedar-monitoring-src/dist/cedar-monitoring');
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
createServer(async (request, response) => {
  let file = join(root, decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!file.startsWith(root)) return response.writeHead(403).end();
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
  } catch {
    file = join(root, 'index.html');
  }
  response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  response.end(await readFile(file));
}).listen(Number(process.env.PORT || 4795), '127.0.0.1');
