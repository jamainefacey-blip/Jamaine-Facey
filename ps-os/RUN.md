# Pain System OS v1 — Run Instructions

## Install

```bash
cd ps-os
npm install
```

## Configure (optional — enables AI parsing)

```bash
cp .env.local.example .env.local
# Edit .env.local and add your OPENAI_API_KEY
```

Without an API key the system uses keyword-based parsing (still functional).

## Run (web mode)

```bash
npm run dev
# Opens at http://localhost:3001
```

## Run (desktop/Electron)

```bash
npm run electron:dev
# Starts Next.js server + opens Electron window
```

## Drop files into /input

```
ps-os/input/           ← drop files here
```

Supported formats: `.txt` `.json` `.pdf` `.png` `.jpg`

The watcher picks up files automatically within ~2 seconds.

## Ingest via API

```bash
curl -X POST http://localhost:3001/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"text": "Your raw notes or structured JSON here", "source": "manual"}'
```

## Ingest via UI

Click **+ Ingest Text** in the top bar, paste text or JSON, click **Parse & Store**.

## How ingestion triggers

1. File dropped in `/input` → chokidar detects it
2. Text extracted (txt/json: direct read · pdf: pdf-parse · image: Tesseract OCR)
3. Text sent to `/api/ingest`
4. If valid structured JSON → stored directly (AI skipped)
5. If raw text + `OPENAI_API_KEY` set → GPT-4o-mini parses to structured JSON
6. If raw text + no API key → keyword fallback parser runs
7. Assets upserted into SQLite (duplicates detected by name)
8. Dashboard auto-refreshes via 5s polling

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/assets` | All assets (filter: `?type=project&status=active&priority=5`) |
| GET | `/api/assets/:id` | Asset detail with notes + linked assets |
| POST | `/api/ingest` | Ingest raw text or structured JSON |
| GET | `/api/status` | Last update timestamp + recent ingestion logs |

## LLM Bridge (structured JSON input)

Send this format and AI parsing is skipped entirely:

```json
{
  "projects":  [{ "name": "", "purpose": "", "status": "active", "priority": 5, "notes": [] }],
  "tools":     [{ "name": "", "purpose": "", "status": "building", "priority": 4, "notes": [] }],
  "workflows": [],
  "systems":   [],
  "notes":     ["standalone note"],
  "decisions": ["key decision"]
}
```
