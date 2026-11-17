/** Optional standalone BlueMap proxy. Node 22+, hosted separately from Pages. */
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const origin = process.env.MAP_UPSTREAM_ORIGIN;
if (!origin) throw new Error('Set MAP_UPSTREAM_ORIGIN on the proxy server.');
const base = new URL(origin);
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password)
  throw new Error('MAP_UPSTREAM_ORIGIN must be an HTTP(S) origin without credentials.');
const parents = (process.env.MAP_ALLOWED_PARENTS ||
  'https://mcfeather.com https://www.mcfeather.com https://tr1ton4ikus.github.io')
  .split(/\s+/).filter(Boolean).map(value => new URL(value).origin);
const prefix = process.env.MAP_PROXY_PATH || '/';
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(prefix)) throw new Error('Invalid MAP_PROXY_PATH.');
const types = {
  ttf:'font/ttf', otf:'font/otf', woff:'font/woff', woff2:'font/woff2',
  png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp',
  ico:'image/x-icon', svg:'image/svg+xml', gz:'application/gzip',
  bin:'application/octet-stream', ktx2:'image/ktx2', js:'text/javascript',
  css:'text/css', json:'application/json', html:'text/html',
};
const unavailable = response => {
  response.writeHead(503, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Retry-After':'60'});
  response.end('<!doctype html><html lang="ru"><meta charset="utf-8"><title>Карта недоступна</title><h1>Карта временно недоступна</h1><p>Попробуй обновить страницу через минуту.</p></html>');
};
const bridge = `<script>(()=>{const parents=${JSON.stringify(parents)};const sync=()=>parents.forEach(origin=>parent.postMessage({type:'feather-map-view',hash:location.hash},origin));addEventListener('load',sync,{once:true});addEventListener('hashchange',sync)})();</script>`;
const server = createServer(async (request, response) => {
  if (!['GET','HEAD'].includes(request.method)) {
    response.writeHead(405, {Allow:'GET, HEAD'}).end(); return;
  }
  const raw = (request.url || '/').split('?')[0];
  if (!raw.startsWith(prefix)) { response.writeHead(404).end(); return; }
  let parts;
  try {
    parts = raw.slice(prefix.length).split('/').filter(Boolean).map(decodeURIComponent);
    if (parts.some(part => part === '.' || part === '..' || /[\\/\x00]/.test(part))) throw new Error('path');
  } catch { response.writeHead(400).end(); return; }
  try {
    const target = new URL(parts.map(encodeURIComponent).join('/') || '.', base.origin + '/');
    const query = request.url.indexOf('?');
    if (query >= 0) target.search = request.url.slice(query);
    const upstream = await fetch(target, {
      redirect:'manual', signal:AbortSignal.timeout(20000),
      headers:{Accept:request.headers.accept || '*/*'},
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      await upstream.body?.cancel(); unavailable(response); return;
    }
    const extension = parts.at(-1)?.split('.').pop()?.toLowerCase();
    const type = types[extension] || upstream.headers.get('content-type') || 'application/octet-stream';
    const headers = {
      'Content-Type':type,
      'Cache-Control':parts.includes('live') || /html|json/.test(type) ? 'no-store' : 'public, max-age=300',
      'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer',
      'Content-Security-Policy':`default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors ${parents.join(' ')}; base-uri 'self'; form-action 'none'`,
    };
    if (upstream.status === 404 && parts.includes('playerheads')) {
      await upstream.body?.cancel();
      response.writeHead(200,{...headers,'Content-Type':'image/svg+xml'});
      response.end('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#30291f"/></svg>'); return;
    }
    if (!upstream.ok) {
      await upstream.body?.cancel(); response.writeHead(upstream.status,headers).end(); return;
    }
    if (type.includes('text/event-stream')) {
      await upstream.body?.cancel(); response.writeHead(204,headers).end(); return;
    }
    if (request.method === 'HEAD') {
      await upstream.body?.cancel(); response.writeHead(200,headers).end(); return;
    }
    if (/(?:text\/|javascript|json|xml)/.test(type)) {
      let body = (await upstream.text()).replaceAll(base.origin,prefix.replace(/\/$/,''))
        .replaceAll(base.host,'Feather');
      if (type.includes('text/html')) body = body.replace(/<head>/i,`<head><base href="${prefix}">`)
        .replace(/<title>.*?<\/title>/i,'<title>Feather — Карта мира</title>')
        .replace(/<\/body>/i,bridge+'</body>');
      response.writeHead(200,headers); response.end(body); return;
    }
    response.writeHead(200,headers);
    if (upstream.body) await pipeline(Readable.fromWeb(upstream.body), response);
    else response.end();
  } catch {
    if (!response.headersSent) unavailable(response);
    else response.destroy();
  }
});
server.listen(Number(process.env.MAP_PROXY_PORT || 8101), process.env.MAP_PROXY_HOST || '127.0.0.1', () => {
  console.log('Feather map proxy ready. Put this service behind HTTPS before connecting Pages.');
});
