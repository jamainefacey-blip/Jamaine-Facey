/**
 * VST User Store — in-memory mock (Phase 3.2)
 *
 * NOT a production database. Resets on server restart.
 * Replace with a real DB adapter before any live deployment.
 *
 * Exports: UserStore, jwt (sign/verify), hashPassword, checkPassword
 *
 * Env vars:
 *   JWT_SECRET — HMAC-SHA256 signing key (default: dev placeholder)
 *   JWT_TTL_SECONDS — token lifetime (default: 86400 = 24h)
 */
'use strict';
const crypto = require('crypto');

/* ── JWT ────────────────────────────────────────────────────────────────── */
const JWT_SECRET = process.env.JWT_SECRET || 'vst-dev-secret-replace-before-production';
const JWT_TTL    = parseInt(process.env.JWT_TTL_SECONDS) || 86400;

function b64url(data) {
  return Buffer.from(data).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64decode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

const jwt = {
  sign(payload) {
    const now     = Math.floor(Date.now() / 1000);
    const claims  = Object.assign({ iat: now, exp: now + JWT_TTL }, payload);
    const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body    = b64url(JSON.stringify(claims));
    const sig     = crypto.createHmac('sha256', JWT_SECRET)
      .update(header + '.' + body).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return header + '.' + body + '.' + sig;
  },

  verify(token) {
    if (!token || typeof token !== 'string') throw new Error('missing token');
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('malformed token');
    const expected = crypto.createHmac('sha256', JWT_SECRET)
      .update(parts[0] + '.' + parts[1]).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    if (expected !== parts[2]) throw new Error('invalid signature');
    const payload = JSON.parse(b64decode(parts[1]));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('token expired');
    return payload;
  },

  fromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('missing bearer token');
    return jwt.verify(authHeader.slice(7));
  },
};

/* ── Password utils ─────────────────────────────────────────────────────── */
function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return { hash, salt };
}

function checkPassword(password, hash, salt) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex') === hash;
}

/* ── UUID ───────────────────────────────────────────────────────────────── */
function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

/* ── Default profile factories ──────────────────────────────────────────── */
function defaultNotificationPreferences() {
  return {
    channels: { push: true, in_app: true, sms: true, whatsapp: false, voice: false },
    domains:  { booking: true, eco: true, community: true, pain_guard: true },
    quiet_hours: { enabled: false, window_start: '22:00', window_end: '08:00' },
  };
}

function defaultGdpr(termsAccepted = true) {
  const now = new Date().toISOString();
  return {
    consent_record: {
      terms_accepted:        termsAccepted,
      terms_accepted_at:     termsAccepted ? now : null,
      terms_version:         'v1.0',
      privacy_accepted:      termsAccepted,
      privacy_accepted_at:   termsAccepted ? now : null,
      privacy_version:       'v1.0',
      consent_marketing_email:    false,
      consent_marketing_sms:      false,
      consent_analytics:          false,
      consent_personalisation:    false,
    },
    lawful_basis: {
      account_operation: 'CONTRACT',
      sos_notifications: 'LEGITIMATE_INTEREST',
      marketing:         'CONSENT',
      analytics:         'CONSENT',
      booking_records:   'LEGAL_OBLIGATION',
    },
    data_retention: { category: 'ACTIVE' },
    requests: [],
  };
}

function createUser({ email, password, full_name = '', tier = 'GUEST', termsAccepted = true }) {
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  return {
    id:            uuid(),
    tier,
    password_hash: hash,
    password_salt: salt,
    identity: {
      email,
      email_verified:  false,
      phone:           null,
      phone_verified:  false,
      full_name:       full_name || '',
      preferred_name:  full_name ? full_name.split(' ')[0] : '',
      avatar_url:      null,
      date_of_birth:   null,
      nationality:     null,
      passport_number: null,
      passport_expiry: null,
      kyc_status:      'NOT_STARTED',
    },
    preferences: {
      locale:           'en-GB',
      timezone:         'Europe/London',
      currency:         'GBP',
      home_airport:     null,
      cabin_class:      'ECONOMY',
      seat_preference:  'NO_PREFERENCE',
      meal_preference:  'STANDARD',
      loyalty_programs: [],
    },
    accessibility: {
      mobility:          'NONE',
      wheelchair_type:   'NOT_APPLICABLE',
      vision:            'NONE',
      hearing:           'NONE',
      cognitive:         false,
      dietary_medical:   [],
      requires_carer:    false,
      additional_notes:  '',
    },
    sos_contacts: [],
    travel_history: {
      total_trips:      0,
      total_nights:     0,
      countries_visited:[],
      total_spend_gbp:  0,
      carbon_kg_total:  0,
      carbon_kg_offset: 0,
      last_trip_at:     null,
    },
    verification: {
      email_verified_at:   null,
      phone_verified_at:   null,
      kyc_verified_at:     null,
      kyc_provider:        null,
      two_factor_enabled:  false,
      two_factor_method:   'NONE',
    },
    notification_preferences: defaultNotificationPreferences(),
    gdpr:      defaultGdpr(termsAccepted),
    pain_guard: { enrolled: false, enrolled_at: null, active_task_count: 0, handoff_required: false },
    created_at:    now,
    updated_at:    now,
    last_login_at: null,
    deleted_at:    null,
  };
}

/* ── In-memory store ────────────────────────────────────────────────────── */
const _byId    = new Map(); /* id → user */
const _byEmail = new Map(); /* email (lower) → id */

function _seed(userData) {
  const user = createUser(userData);
  _byId.set(user.id, user);
  _byEmail.set(user.identity.email.toLowerCase(), user.id);
  return user;
}

/* Seeded demo accounts — investor demo use only */
const _demo = _seed({ email: 'demo@voyage.test',  password: 'voyage123', full_name: 'Alex Morgan',   tier: 'PREMIUM' });
const _elite = _seed({ email: 'elite@voyage.test', password: 'voyage123', full_name: 'Jordan Blake',  tier: 'VOYAGE_ELITE' });
/* Make the PREMIUM user look more interesting */
_demo.identity.phone          = '+447700900001';
_demo.identity.email_verified = true;
_demo.identity.nationality    = 'GB';
_demo.preferences.home_airport = 'LHR';
_demo.preferences.cabin_class  = 'PREMIUM_ECONOMY';
_demo.accessibility.mobility   = 'NONE';
_demo.sos_contacts.push({
  contact_id: uuid(), name: 'Sam Morgan', phone: '+447700900002',
  relationship: 'SPOUSE', notify_on_departure: true, consent_given: true,
  consent_given_at: _demo.created_at,
});
_demo.travel_history.total_trips     = 12;
_demo.travel_history.total_nights    = 84;
_demo.travel_history.countries_visited = ['GB', 'FR', 'DE', 'JP', 'US', 'AE'];
_demo.travel_history.total_spend_gbp = 18450;
_demo.travel_history.carbon_kg_total = 4200;
_demo.travel_history.carbon_kg_offset = 1800;

/* Make the ELITE user look more interesting */
_elite.identity.phone           = '+447700900010';
_elite.identity.email_verified  = true;
_elite.identity.kyc_status      = 'VERIFIED';
_elite.identity.nationality     = 'US';
_elite.preferences.home_airport = 'JFK';
_elite.preferences.cabin_class  = 'BUSINESS';
_elite.verification.kyc_verified_at = _elite.created_at;
_elite.pain_guard.enrolled      = true;
_elite.pain_guard.active_task_count = 2;
_elite.sos_contacts.push({
  contact_id: uuid(), name: 'Riley Blake', phone: '+12025550143',
  relationship: 'PARTNER', notify_on_departure: true, consent_given: true,
  consent_given_at: _elite.created_at,
});
_elite.travel_history.total_trips     = 47;
_elite.travel_history.total_nights    = 390;
_elite.travel_history.countries_visited = ['US', 'GB', 'FR', 'JP', 'AE', 'SG', 'AU', 'BR', 'ZA'];
_elite.travel_history.total_spend_gbp = 112000;
_elite.travel_history.carbon_kg_total = 18600;
_elite.travel_history.carbon_kg_offset = 9300;

/* ── Public API ─────────────────────────────────────────────────────────── */
const UserStore = {
  findByEmail(email) {
    const id = _byEmail.get(email.toLowerCase());
    return id ? _byId.get(id) || null : null;
  },

  findById(id) {
    return _byId.get(id) || null;
  },

  create({ email, password, full_name, termsAccepted }) {
    if (_byEmail.has(email.toLowerCase())) throw new Error('EMAIL_TAKEN');
    const user = createUser({ email, password, full_name, termsAccepted });
    _byId.set(user.id, user);
    _byEmail.set(email.toLowerCase(), user.id);
    return user;
  },

  update(id, patch) {
    const user = _byId.get(id);
    if (!user) throw new Error('NOT_FOUND');
    /* Deep merge for allowed owner-writable sections only */
    const WRITABLE = ['preferences', 'accessibility', 'sos_contacts', 'notification_preferences'];
    for (const key of WRITABLE) {
      if (patch[key] !== undefined) {
        user[key] = Array.isArray(patch[key])
          ? patch[key]
          : Object.assign({}, user[key], patch[key]);
      }
    }
    /* Identity: non-verified fields only */
    if (patch.identity) {
      const SAFE_IDENTITY = ['full_name', 'preferred_name', 'avatar_url', 'date_of_birth', 'nationality', 'passport_number', 'passport_expiry'];
      for (const f of SAFE_IDENTITY) {
        if (patch.identity[f] !== undefined) user.identity[f] = patch.identity[f];
      }
    }
    user.updated_at = new Date().toISOString();
    return user;
  },

  touchLogin(id) {
    const user = _byId.get(id);
    if (user) user.last_login_at = new Date().toISOString();
    return user;
  },

  /* Strip credentials and sensitive fields for API response */
  toPublicProfile(user, includeSensitive = false) {
    const profile = JSON.parse(JSON.stringify(user)); /* deep clone */
    delete profile.password_hash;
    delete profile.password_salt;
    if (!includeSensitive) {
      if (profile.identity) {
        delete profile.identity.passport_number;
        delete profile.identity.passport_expiry;
      }
      if (profile.accessibility) delete profile.accessibility.dietary_medical;
      if (profile.verification) delete profile.verification.kyc_reference_id;
      if (profile.gdpr) delete profile.gdpr.dpo_notes;
    }
    return profile;
  },
};

module.exports = { UserStore, jwt, hashPassword, checkPassword, uuid };
