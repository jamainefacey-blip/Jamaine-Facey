/* ─────────────────────────────────────────────────────────────────────────────
   VST — Twilio Provider
   Handles SMS, WhatsApp, and Voice channels via Twilio REST API.
   Uses HTTP CONNECT egress tunnel (same pattern as vst-server.js).
   ───────────────────────────────────────────────────────────────────────────── */

'use strict';

const net  = require('net');
const tls  = require('tls');
const http = require('http');

const TWILIO_HOST = 'api.twilio.com';
const TWILIO_PORT = 443;
const PROXY_HOST  = process.env.EGRESS_PROXY_HOST || 'localhost';
const PROXY_PORT  = parseInt(process.env.EGRESS_PROXY_PORT || '3128', 10);
const USE_PROXY   = !!(process.env.EGRESS_PROXY_HOST);

function _formEncode(obj) {
  return Object.keys(obj).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
  }).join('&');
}

function _request(path, body, sid, token) {
  return new Promise(function (resolve, reject) {
    var payload = _formEncode(body);
    var auth    = Buffer.from(sid + ':' + token).toString('base64');

    function doRequest(socket) {
      var options = {
        method:   'POST',
        hostname: TWILIO_HOST,
        path:     path,
        headers:  {
          'Authorization': 'Basic ' + auth,
          'Content-Type':  'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload),
        },
        createConnection: function () { return socket; },
      };
      var req = http.request(options, function (res) {
        var chunks = [];
        res.on('data', function (c) { chunks.push(c); });
        res.on('end', function () {
          var raw = Buffer.concat(chunks).toString();
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch (e) { resolve({ status: res.statusCode, body: raw }); }
        });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    }

    if (!USE_PROXY) {
      var tlsSocket = tls.connect({ host: TWILIO_HOST, port: TWILIO_PORT, servername: TWILIO_HOST });
      tlsSocket.on('secureConnect', function () { doRequest(tlsSocket); });
      tlsSocket.on('error', reject);
      return;
    }

    var tcp = net.connect(PROXY_PORT, PROXY_HOST);
    tcp.on('connect', function () {
      tcp.write('CONNECT ' + TWILIO_HOST + ':' + TWILIO_PORT + ' HTTP/1.1\r\nHost: ' + TWILIO_HOST + ':' + TWILIO_PORT + '\r\n\r\n');
      tcp.once('data', function () {
        var tlsSock = tls.connect({ socket: tcp, servername: TWILIO_HOST });
        tlsSock.on('secureConnect', function () { doRequest(tlsSock); });
        tlsSock.on('error', reject);
      });
    });
    tcp.on('error', reject);
  });
}

function _creds() {
  var sid   = process.env.TWILIO_ACCOUNT_SID;
  var token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return { sid, token };
}

/* Send SMS (or WhatsApp if toNumber prefixed with whatsapp:) */
async function sendSms(opts) {
  /* opts: { to, body, whatsapp? } */
  var c = _creds();
  if (!c) return { ok: false, provider_msg_id: null, error: 'TWILIO_NOT_CONFIGURED' };

  var from = opts.whatsapp
    ? (process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886')
    : process.env.TWILIO_FROM_NUMBER;
  if (!from) return { ok: false, provider_msg_id: null, error: 'TWILIO_FROM_NOT_CONFIGURED' };

  var to = opts.whatsapp && !opts.to.startsWith('whatsapp:')
    ? 'whatsapp:' + opts.to
    : opts.to;

  try {
    var res = await _request(
      '/2010-04-01/Accounts/' + c.sid + '/Messages.json',
      { To: to, From: from, Body: opts.body },
      c.sid, c.token
    );
    if (res.status === 201 && res.body && res.body.sid) {
      return { ok: true, provider_msg_id: res.body.sid, error: null };
    }
    return { ok: false, provider_msg_id: null, error: (res.body && res.body.message) ? res.body.message : 'TWILIO_SMS_ERROR_' + res.status };
  } catch (err) {
    return { ok: false, provider_msg_id: null, error: err.message || 'TWILIO_REQUEST_FAILED' };
  }
}

/* Initiate a voice call with TwiML */
async function sendVoice(opts) {
  /* opts: { to, twiml } */
  var c = _creds();
  if (!c) return { ok: false, provider_msg_id: null, error: 'TWILIO_NOT_CONFIGURED' };

  var from = process.env.TWILIO_FROM_NUMBER;
  if (!from) return { ok: false, provider_msg_id: null, error: 'TWILIO_FROM_NOT_CONFIGURED' };

  var twiml = opts.twiml || '<Response><Say voice="alice">This is an emergency alert from Voyage Smart Travel. Please check the VST app for details.</Say></Response>';

  try {
    var res = await _request(
      '/2010-04-01/Accounts/' + c.sid + '/Calls.json',
      { To: opts.to, From: from, Twiml: twiml },
      c.sid, c.token
    );
    if (res.status === 201 && res.body && res.body.sid) {
      return { ok: true, provider_msg_id: res.body.sid, error: null };
    }
    return { ok: false, provider_msg_id: null, error: (res.body && res.body.message) ? res.body.message : 'TWILIO_VOICE_ERROR_' + res.status };
  } catch (err) {
    return { ok: false, provider_msg_id: null, error: err.message || 'TWILIO_REQUEST_FAILED' };
  }
}

module.exports = { sendSms, sendVoice };
