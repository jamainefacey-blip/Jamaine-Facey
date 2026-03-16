# Mr Pain PT — White-Label Deployment Plan

**Phase:** 5
**Status:** Design only — not implemented

---

## Purpose

Phase 5 makes adding a new client a configuration operation rather than a manual deployment task. Each client gets their own isolated, branded web app with a unique URL — automatically provisioned from their config files in `clients/<slug>/`.

---

## The `client.meta.json` registry

Every client folder contains a `client.meta.json` file. This is the machine-readable record for provisioning and the source of truth for deployment state.

### Full field specification

```json
{
  "_comment": "Client registry entry. Managed by the provisioning system from Phase 5.",

  "clientId":     "sarah-thompson",
  "slug":         "sarah",
  "displayName":  "Sarah Thompson",
  "status":       "active",

  "program": {
    "condition":    "ACL Reconstruction",
    "startDate":    "2026-01-27",
    "totalWeeks":   12,
    "currentPhase": 1
  },

  "coach": {
    "coachId":   "marcus-reid",
    "coachName": "Marcus Reid DPT, CSCS"
  },

  "deployment": {
    "deployUrl":    "https://sarah.mrpainpt.com",
    "customDomain": "sarah.mrpainpt.com",
    "netlifyId":    "abc123-netlify-site-id",
    "lastDeployed": "2026-03-14T09:00:00Z",
    "deployStatus": "deployed"
  },

  "_meta": {
    "schemaVersion": "1.0",
    "createdDate":   "2026-01-20",
    "lastUpdated":   "2026-03-14",
    "notes":         "ACL client, progressing well. Phase 2 expected week 5."
  }
}
```

### `status` values

| Value | Meaning |
|-------|---------|
| `active` | Client is in program. App is live. |
| `onboarding` | Config created but not yet deployed. |
| `paused` | Program paused (injury, travel, etc.). App stays live but sessions locked. |
| `completed` | Program finished. App preserved for reference. |
| `archived` | Program complete, app deprovisioned. Config kept for records. |

### `deployment.deployStatus` values

| Value | Meaning |
|-------|---------|
| `pending` | Not yet provisioned. |
| `deployed` | Live and serving. |
| `failed` | Last deploy attempt failed — check Netlify dashboard. |
| `stale` | Config updated since last deploy — needs redeploy. |

---

## How Phase 5 provisioning works

### Step 1 — Coach creates a client config

The coach (or admin) duplicates `clients/_template/`, edits the config files, and sets `status: "onboarding"` in `client.meta.json`.

### Step 2 — Provisioning script runs

A provisioning script (`tools/provision-client.js` — to be built in Phase 5) reads all `client.meta.json` files and provisions any with `deployStatus: "pending"` or `deployStatus: "stale"`.

```
For each clients/*/client.meta.json where deployStatus = "pending":
  1. Create a new Netlify site via the Netlify API
  2. Set the site's build configuration:
     - Base directory: mrpainpt/apps/client
     - Environment variable: CLIENT_ID=<clientId>
  3. Trigger an initial deploy
  4. Configure the custom domain (e.g. <slug>.mrpainpt.com)
  5. Write the netlifyId and deployUrl back to client.meta.json
  6. Set deployStatus = "deployed"
  7. Set status = "active"
```

### Step 3 — Client app reads its own config from the API

Once the API layer is live (Phase 4), the client app bootstraps by calling:

```
GET /api/client
```

This returns the config for the authenticated client. The `CLIENT_ID` environment variable set during provisioning tells the app which client to load.

---

## URL structure

### Default (Netlify subdomain per client)

```
https://sarah.mrpainpt.com      — Sarah Thompson's app
https://james.mrpainpt.com      — James Okonkwo's app
https://lisa.mrpainpt.com       — Lisa Yamamoto's app
```

DNS: A wildcard CNAME record for `*.mrpainpt.com` pointing to Netlify's load balancer.

### Custom domain (clinic white-label)

A PT clinic can supply their own domain:

```
https://rehab.physioclinic.com.au    — Clinic's branded rehab portal
https://coach.physioclinic.com.au    — Coach portal for the same clinic
```

Custom domains are configured via Netlify's custom domain API and set in `client.meta.json → deployment.customDomain`.

---

## Coach portal integration

The coach portal in Phase 5 includes an admin panel with a client management screen:

```
/coach/#admin/clients

Table columns:
  Client name | Status | Phase | Last active | Deploy URL | Deploy status | Actions

Actions:
  Create new client (opens onboarding form)
  Redeploy (triggers provisioning for stale deployments)
  Pause / Resume
  Archive
```

When the coach clicks "Create new client," they fill in the client config via a form. On submit, `client.meta.json` is created and the provisioning script is triggered automatically.

---

## Clinic white-label (Phase 5+)

For a PT clinic deploying multiple PTs under their brand:

### Tenant structure

```
clients/
├── clinic-physioclinic/
│   ├── clinic.config.json    Clinic-level branding and settings
│   └── coaches/
│       ├── sarah-coach/      Coach config
│       └── marcus-coach/
└── clients/
    ├── physioclinic-client-001/
    ├── physioclinic-client-002/
    └── ...
```

### Clinic config fields

```json
{
  "clinicId":     "physioclinic",
  "clinicName":   "PhysioClinic Australia",
  "primaryColor": "#1a5f7a",
  "logoUrl":      "https://assets.physioclinic.com/logo.svg",
  "domain":       "rehab.physioclinic.com.au",
  "coachDomain":  "coach.physioclinic.com.au",
  "disclaimer":   "Custom clinic disclaimer text...",
  "coaches":      ["sarah-coach", "marcus-coach"]
}
```

### Scaling considerations

| Scenario | Clients | Approach |
|----------|---------|----------|
| Solo PT, initial launch | 1–5 | Manual deploy per client (Phases 1–4) |
| Growing solo practice | 5–20 | Phase 5 provisioning script |
| Small clinic (2–5 PTs) | 20–100 | Phase 5 + tenant layer, coach assignment |
| Multi-clinic SaaS | 100+ | Database-driven provisioning, self-service onboarding |

---

## Security considerations

- Each client deployment is isolated — one Netlify site, one set of environment variables, no cross-client data access
- Auth tokens are scoped to a single `clientId` — a token for Sarah cannot access James's data
- The provisioning script holds the Netlify API key — this must be stored as a secret (Netlify environment variable), never committed to the repository
- `client.meta.json` may contain the `netlifyId` — this is not a secret (it's a Netlify internal site ID) but should not be publicly accessible
- Custom domains require SSL certificates — Netlify provisions these automatically via Let's Encrypt

---

## Rollback and deprovisioning

### Pausing a client

Set `status: "paused"` in `client.meta.json`. The provisioning script does not redeploy paused clients. The app remains live but session unlock is disabled (enforced by the API).

### Archiving a client

Set `status: "archived"` and `deployStatus: "stale"`. On next provisioning run, the site is deprovisioned (Netlify site deleted). The `client.meta.json` and config files are kept permanently for records.

### Rollback a failed deploy

If `deployStatus: "failed"`:
1. Check Netlify dashboard for error details
2. Fix the config issue (usually a malformed `client.config.js`)
3. Set `deployStatus: "pending"` to trigger re-provision on next run

---

## Phase 5 build sequence

1. Build `tools/provision-client.js` — reads `client.meta.json` files, calls Netlify API
2. Add `CLIENT_ID` environment variable support to `apps/client/` (bootstrap call to `/api/client`)
3. Add wildcard DNS record for `*.mrpainpt.com`
4. Test end-to-end with a second client config (`clients/jane-doe/`)
5. Add provisioning UI to the coach portal admin panel
6. Document the "add a new client" workflow for non-technical coaches
