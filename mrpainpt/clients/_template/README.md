# Mr Pain PT — Client Template

This folder is the reference template for creating a new client instance on the Mr Pain PT platform.

---

## How to add a new client

### Step 1 — Duplicate this folder

```bash
cp -r mrpainpt/clients/_template mrpainpt/clients/<client-slug>
```

Use a lowercase, hyphenated slug that uniquely identifies the client:

```
mrpainpt/clients/jane-doe/
mrpainpt/clients/alex-chen/
mrpainpt/clients/mark-rodriguez/
```

---

### Step 2 — Edit `client.config.js`

Fill in every field marked `← EDIT`:

| Field | Description |
|-------|-------------|
| `appName` | Shown in the browser tab and app header |
| `accentColor` | CSS hex — controls the entire visual theme |
| `logoText` | 2–3 letter initials shown until a logo is added |
| `client.*` | Name, age, condition, start date, program length |
| `coach.*` | Coach name, credentials, contact instruction |
| `goals[]` | 3–5 program goals shown on the overview screen |
| `milestones[]` | Key progress checkpoints keyed to week numbers |
| `coachNotes[]` | Pre-populate any notes from the program start |
| `disclaimer` | Safety disclaimer — do not remove entirely |

---

### Step 3 — Build `plan.js`

Define the full session schedule. Each week has 2–3 sessions. Each session lists exercise IDs.

Exercise IDs must exist in either:
- `mrpainpt/packages/exercise-library/index.js` — shared library
- This client's `exercises.js` — client-specific exercises

Session IDs follow the pattern `w<week>-s<session>`. They must be unique across the plan:

```
w1-s1, w1-s2, w1-s3
w2-s1, w2-s2
w3-s1, w3-s2, w3-s3
```

---

### Step 4 — Edit `exercises.js` (if needed)

If the client needs exercises not in the shared library, add them here.
If the client needs modified versions of shared exercises, add override objects here (same `id`, only changed fields).

Leave the file empty if the shared library covers all exercises.

---

### Step 5 — Update `client.meta.json`

Fill in the registry metadata. In Phase 5 this drives automated white-label deployment.

---

### Step 6 — Register in MODULE_REGISTRY.md (optional, until Phase 5 automation)

Add an entry to the root `MODULE_REGISTRY.md` so the client is discoverable.

---

## How client programs are structured

```
Client program
│
├── client.config.js    Identity, branding, goals, milestones, coach notes
│
├── plan.js             Session schedule
│   └── weeks[]
│       └── sessions[]
│           └── exercises[]  ← IDs only; resolved at runtime
│
└── exercises.js        Client-specific exercises or overrides on the shared library
```

The shared exercise library at `packages/exercise-library/index.js` is the base.
The client's `exercises.js` only needs to contain what is different.

---

## How exercise overrides work

In Phase 4, the API merges exercises as follows:

```
final_exercise = { ...shared_library[id], ...client_override[id] }
```

This means a client override only needs to specify the fields that differ. Example:

```js
// Override quad-sets to use 20 reps instead of the library default of 15
{
  id:   "quad-sets",
  reps: 20,
  cue:  "Focus on VMO activation — squeeze hard at the top.",
}
```

All other fields (name, description, tempo, rest, etc.) are inherited from the shared library.

---

## How this becomes white-label in Phase 5

Each client folder becomes an independent deployed app. The provisioning flow is:

1. A script reads `client.meta.json` for every folder in `mrpainpt/clients/`
2. For each active client, it triggers a Netlify deploy using the client config as the data source
3. The deployed URL is written back to `client.meta.json → deployment.deployUrl`
4. Each client app is served at `<slug>.mrpainpt.com` or a custom domain

Until Phase 5, each client app requires a manual deploy pointed at its config.

---

## File reference

| File | Purpose |
|------|---------|
| `client.config.js` | Canonical client data — name, condition, branding, goals, notes |
| `plan.js` | Session schedule — weeks, sessions, exercise ID lists |
| `exercises.js` | Client-specific exercises and overrides on the shared library |
| `client.meta.json` | Registry metadata — deployment URLs, status, phase tracking |
| `README.md` | This file |
