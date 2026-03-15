// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — Client CRUD
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const db = require("./db");

// ── Helpers ──────────────────────────────────────────────────────────────────

function _parseRow(row) {
  if (!row) return null;

  let clientConfig = {};
  let program      = {};
  try { clientConfig = JSON.parse(row.client_config); } catch (_) {}
  try { program      = JSON.parse(row.program);       } catch (_) {}

  return {
    slug:         row.slug,
    clientConfig,
    program,
    payment: {
      provider:       row.payment_provider || null,
      productId:      row.product_id       || null,
      subscriptionId: row.subscription_id  || null,
      purchaseId:     row.purchase_id      || null,
      purchaseDate:   row.purchase_date    || null,
      expiryDate:     row.expiry_date      || null,
      billingStatus:  row.billing_status   || null,
    },
    _hasEdits: !!row.has_edits,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function _clientName(clientConfig) {
  const c = clientConfig?.client || {};
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || null;
}

// ── Queries ──────────────────────────────────────────────────────────────────

const _stmts = {
  listAll:   db.prepare(`SELECT slug, client_config, access_type, access_status, has_edits, updated_at FROM clients ORDER BY slug`),
  getOne:    db.prepare(`SELECT * FROM clients WHERE slug = ?`),
  exists:    db.prepare(`SELECT 1 FROM clients WHERE slug = ?`),
  insert:    db.prepare(`
    INSERT INTO clients (slug, client_config, program, access_type, access_status)
    VALUES (@slug, @client_config, @program, @access_type, @access_status)
  `),
  touchUpdated: db.prepare(`UPDATE clients SET updated_at = datetime('now') WHERE slug = ?`),
};

// ── Public API ────────────────────────────────────────────────────────────────

function listAll() {
  return _stmts.listAll.all().map(row => {
    let cfg = {};
    try { cfg = JSON.parse(row.client_config); } catch (_) {}
    return {
      slug:         row.slug,
      name:         _clientName(cfg) || row.slug,
      accessType:   row.access_type,
      accessStatus: row.access_status,
      _hasEdits:    !!row.has_edits,
      updatedAt:    row.updated_at,
    };
  });
}

function exists(slug) {
  return !!_stmts.exists.get(slug);
}

function get(slug) {
  return _parseRow(_stmts.getOne.get(slug));
}

function create(slug, clientConfig, program) {
  const accessType   = program?.access?.type   || "subscription";
  const accessStatus = program?.access?.status || "active";

  _stmts.insert.run({
    slug,
    client_config: JSON.stringify(clientConfig || {}),
    program:       JSON.stringify(program       || {}),
    access_type:   accessType,
    access_status: accessStatus,
  });

  return get(slug);
}

function update(slug, body) {
  // Build SET clauses dynamically — only update fields that are present in body.
  const sets   = [];
  const values = {};

  if (body.clientConfig !== undefined) {
    sets.push("client_config = @client_config");
    values.client_config = JSON.stringify(body.clientConfig);
  }

  if (body.program !== undefined) {
    sets.push("program = @program");
    values.program = JSON.stringify(body.program);
    // Mirror access fields to top-level columns for easy querying
    const acc = body.program?.access;
    if (acc?.type)   { sets.push("access_type = @access_type");     values.access_type   = acc.type;   }
    if (acc?.status) { sets.push("access_status = @access_status"); values.access_status = acc.status; }
  }

  if (body.payment !== undefined) {
    const p = body.payment;
    const pMap = {
      provider:       "payment_provider",
      productId:      "product_id",
      subscriptionId: "subscription_id",
      purchaseId:     "purchase_id",
      purchaseDate:   "purchase_date",
      expiryDate:     "expiry_date",
      billingStatus:  "billing_status",
    };
    Object.entries(pMap).forEach(([jsKey, dbCol]) => {
      if (p[jsKey] !== undefined) {
        sets.push(`${dbCol} = @${dbCol}`);
        values[dbCol] = p[jsKey];
      }
    });
  }

  if (body._hasEdits !== undefined) {
    sets.push("has_edits = @has_edits");
    values.has_edits = body._hasEdits ? 1 : 0;
  }

  sets.push("updated_at = datetime('now')");
  values.slug = slug;

  if (sets.length > 1) {   // >1 because updated_at is always in the list
    db.prepare(`UPDATE clients SET ${sets.join(", ")} WHERE slug = @slug`).run(values);
  }

  return get(slug);
}

module.exports = { listAll, exists, get, create, update };
