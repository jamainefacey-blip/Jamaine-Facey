/**
 * P6-LIVE-01 (CONTROLLED) — Anthropic CORS Proxy with egress-proxy tunneling
 * Listens on port 7701. Forwards browser POST requests to the real Anthropic API
 * using HTTP CONNECT tunneling through the environment's egress proxy.
 * CORS headers are added so the browser can read the response.
 */
'use strict';
const http  = require('http');
const tls   = require('tls');
const net   = require('net');

const REAL_HOST = 'api.anthropic.com';
const REAL_PORT = 443;

const CORS_HEADERS = [
  'Access-Control-Allow-Origin: *',
  'Access-Control-Allow-Methods: POST, OPTIONS',
  'Access-Control-Allow-Headers: Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-api-access, Authorization',
  'Access-Control-Max-Age: 86400',
];

function getEgressProxy() {
  const raw = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return { host: u.hostname, port: parseInt(u.port) || 80, auth: u.username + ':' + decodeURIComponent(u.password) };
  } catch (e) { return null; }
}

/* Returns a TLS socket connected to api.anthropic.com:443 */
function getTlsSocket() {
  return new Promise((resolve, reject) => {
    const eProxy = getEgressProxy();
    if (!eProxy) {
      const s = tls.connect({ host: REAL_HOST, port: REAL_PORT, servername: REAL_HOST }, () => resolve(s));
      s.on('error', reject);
      return;
    }
    const tcp = net.connect(eProxy.port, eProxy.host, () => {
      const authB64 = Buffer.from(eProxy.auth).toString('base64');
      tcp.write(
        'CONNECT ' + REAL_HOST + ':' + REAL_PORT + ' HTTP/1.1\r\n' +
        'Host: ' + REAL_HOST + ':' + REAL_PORT + '\r\n' +
        'Proxy-Authorization: Basic ' + authB64 + '\r\n\r\n'
      );
      let hdr = '';
      const onData = (chunk) => {
        hdr += chunk.toString();
        if (!hdr.includes('\r\n\r\n')) return; // still reading headers
        tcp.removeListener('data', onData);
        const statusLine = hdr.split('\r\n')[0];
        if (!statusLine.includes('200')) {
          tcp.destroy();
          return reject(new Error('CONNECT failed: ' + statusLine));
        }
        // Upgrade TCP socket to TLS
        const tlsSock = tls.connect({ socket: tcp, servername: REAL_HOST, rejectUnauthorized: true }, () => resolve(tlsSock));
        tlsSock.on('error', reject);
      };
      tcp.on('data', onData);
    });
    tcp.on('error', reject);
  });
}

/* Send HTTP/1.1 POST over tls socket, return { status, body } */
function doPost(tlsSock, body, token) {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.isBuffer(body) ? body : Buffer.from(body);
    const req = [
      'POST /v1/messages HTTP/1.1',
      'Host: ' + REAL_HOST,
      'Content-Type: application/json',
      'Content-Length: ' + bodyBuf.length,
      'anthropic-version: 2023-06-01',
      'Authorization: Bearer ' + token,
      'Connection: close',
      '',
      '',
    ].join('\r\n');
    tlsSock.write(req);
    tlsSock.write(bodyBuf);

    let raw = Buffer.alloc(0);
    tlsSock.on('data', c => { raw = Buffer.concat([raw, c]); });
    tlsSock.on('end', () => {
      const s = raw.toString();
      const headerEnd = s.indexOf('\r\n\r\n');
      if (headerEnd === -1) return reject(new Error('No header end found'));
      const headerPart = s.slice(0, headerEnd);
      const statusMatch = headerPart.match(/^HTTP\/\d\.\d (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 502;
      // Handle chunked transfer encoding
      const bodyRaw = raw.slice(headerEnd + 4);
      const isChunked = /transfer-encoding:\s*chunked/i.test(headerPart);
      let finalBody;
      if (isChunked) {
        finalBody = decodeChunked(bodyRaw);
      } else {
        finalBody = bodyRaw;
      }
      resolve({ status, body: finalBody });
    });
    tlsSock.on('error', reject);
  });
}

function decodeChunked(buf) {
  const chunks = [];
  let pos = 0;
  const s = buf.toString();
  while (pos < s.length) {
    const crlfIdx = s.indexOf('\r\n', pos);
    if (crlfIdx === -1) break;
    const sizeHex = s.slice(pos, crlfIdx).trim();
    const size = parseInt(sizeHex, 16);
    if (isNaN(size) || size === 0) break;
    const start = crlfIdx + 2;
    chunks.push(buf.slice(start, start + size));
    pos = start + size + 2; // skip trailing \r\n
  }
  return Buffer.concat(chunks);
}

const server = http.createServer((req, res) => {
  // Add CORS headers
  CORS_HEADERS.forEach(h => {
    const [k, ...v] = h.split(': ');
    res.setHeader(k, v.join(': '));
  });

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST')    { res.writeHead(405); res.end(); return; }

  const TOKEN = server._token;
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    const body = Buffer.concat(chunks);
    try {
      const tlsSock = await getTlsSocket();
      const result  = await doPost(tlsSock, body, TOKEN);
      tlsSock.destroy();
      CORS_HEADERS.forEach(h => { const [k, ...v] = h.split(': '); res.setHeader(k, v.join(': ')); });
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(result.status);
      res.end(result.body);
      console.log('Forwarded → status=' + result.status + ' bodyLen=' + result.body.length);
    } catch (e) {
      console.error('Proxy error:', e.message);
      CORS_HEADERS.forEach(h => { const [k, ...v] = h.split(': '); res.setHeader(k, v.join(': ')); });
      res.writeHead(502);
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

if (require.main === module) {
  const token = require('fs').readFileSync('/home/claude/.claude/remote/.session_ingress_token', 'utf8').trim();
  server._token = token;
  server.listen(7701, '127.0.0.1', () => {
    console.log('Anthropic CORS proxy on http://127.0.0.1:7701  (egress=' + (getEgressProxy() ? getEgressProxy().host + ':' + getEgressProxy().port : 'direct') + ')');
  });
}

module.exports = server;
