/* ─────────────────────────────────────────────────────────────────────────────
   VST — OneSignal Provider
   Handles push and in_app channels via OneSignal REST API.
   Uses HTTP CONNECT egress tunnel (same pattern as vst-server.js).
   ───────────────────────────────────────────────────────────────────────────── */

'use strict';

const net  = require('net');
const tls  = require('tls');
const http = require('http');

const ONESIGNAL_HOST = 'onesignal.com';
const ONESIGNAL_PORT = 443;
const PROXY_HOST     = process.env.EGRESS_PROXY_HOST || 'localhost';
const PROXY_PORT     = parseInt(process.env.EGRESS_PROXY_PORT || '3128', 10);
const USE_PROXY      = !!(process.env.EGRESS_PROXY_HOST);

/* Low-level HTTPS request through optional egress tunnel */
function _request(path, method, body) {
  return new Promise(function (resolve, reject) {
    var payload = body ? JSON.stringify(body) : null;
    var headers = [
      'Authorization: Basic ' + process.env.ONESIGNAL_API_KEY,
      'Content-Type: application/json',
    ];
    if (payload) headers.push('Content-Length: ' + Buffer.byteLength(payload));

    function doRequest(socket) {
      var req = http.request({
        method:   method,
        hostname: ONESIGNAL_HOST,
        path:     path,
        headers:  Object.fromEntries(headers.map(function (h) { var i = h.indexOf(':'); return [h.slice(0,i).trim(), h.slice(i+1).trim()]; })),
        createConnection: function () { return socket; },
      }, function (res) {
        var chunks = [];
        res.on('data', function (c) { chunks.push(c); });
        res.on('end', function () {
          var raw = Buffer.concat(chunks).toString();
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch (e) { resolve({ status: res.statusCode, body: raw }); }
        });
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    }

    if (!USE_PROXY) {
      var tlsSocket = tls.connect({ host: ONESIGNAL_HOST, port: ONESIGNAL_PORT, servername: ONESIGNAL_HOST });
      tlsSocket.on('secureConnect', function () { doRequest(tlsSocket); });
      tlsSocket.on('error', reject);
      return;
    }

    var tcp = net.connect(PROXY_PORT, PROXY_HOST);
    tcp.on('connect', function () {
      tcp.write('CONNECT ' + ONESIGNAL_HOST + ':' + ONESIGNAL_PORT + ' HTTP/1.1\r\nHost: ' + ONESIGNAL_HOST + ':' + ONESIGNAL_PORT + '\r\n\r\n');
      tcp.once('data', function () {
        var tlsSock = tls.connect({ socket: tcp, servername: ONESIGNAL_HOST });
        tlsSock.on('secureConnect', function () { doRequest(tlsSock); });
        tlsSock.on('error', reject);
      });
    });
    tcp.on('error', reject);
  });
}

/* Send a push or in_app notification via OneSignal */
async function sendPush(opts) {
  /* opts: { player_id?, segments, title, body, data, url, image_url, channel } */
  var appId = process.env.ONESIGNAL_APP_ID;
  if (!appId || !process.env.ONESIGNAL_API_KEY) {
    return { ok: false, provider_msg_id: null, error: 'ONESIGNAL_NOT_CONFIGURED' };
  }

  var notif = {
    app_id:   appId,
    headings: { en: opts.title },
    contents: { en: opts.body  },
  };

  if (opts.player_id) {
    notif.include_player_ids = [opts.player_id];
  } else {
    notif.included_segments = ['All'];
  }

  if (opts.url)       notif.url       = opts.url;
  if (opts.image_url) notif.large_icon = opts.image_url;
  if (opts.data)      notif.data      = opts.data;

  /* In-app uses content_available flag to suppress lock-screen display */
  if (opts.channel === 'in_app') {
    notif.content_available = true;
    notif.apns_push_type_override = 'background';
  }

  try {
    var res = await _request('/api/v1/notifications', 'POST', notif);
    if (res.status === 200 && res.body && res.body.id) {
      return { ok: true, provider_msg_id: res.body.id, error: null };
    }
    return { ok: false, provider_msg_id: null, error: (res.body && res.body.errors) ? JSON.stringify(res.body.errors) : 'ONESIGNAL_ERROR_' + res.status };
  } catch (err) {
    return { ok: false, provider_msg_id: null, error: err.message || 'ONESIGNAL_REQUEST_FAILED' };
  }
}

module.exports = { sendPush };
