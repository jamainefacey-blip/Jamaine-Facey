// AI Lab — local dev server
// Serves static files from this directory + POST /api/action for data persistence.
// No external dependencies — built-in Node.js only.

const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT       = process.env.PORT || 4444;
const STATIC_DIR = __dirname;
const DATA_DIR   = path.join(__dirname, "data");

const FILE_MAP = {
  A: "leads.json",
  B: "bookings.json",
  C: "enterprise.json",
  D: "analysis.json"
};

const LOG_LABELS = {
  A: "Lead captured",
  B: "Booking created",
  C: "Enterprise escalation",
  D: "Stored for analysis"
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".ico":  "image/x-icon"
};

// Ensure data dir exists on startup
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Read a JSON array store — returns [] if missing or empty/corrupt
function readStore(file) {
  const fp = path.join(DATA_DIR, file);
  try {
    const raw = fs.existsSync(fp) ? fs.readFileSync(fp, "utf8").trim() : "";
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

// Append one entry to a store (append-only, never overwrites prior records)
function appendStore(file, entry) {
  const records = readStore(file);
  records.push(entry);
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(records, null, 2) + "\n");
}

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const server = http.createServer((req, res) => {
  // Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  // ── POST /api/action ────────────────────────────────────────────────────────
  if (req.method === "POST" && req.url === "/api/action") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const { route, object } = JSON.parse(body);
        const file = FILE_MAP[route];
        if (!file) {
          res.writeHead(400, { "Content-Type": "application/json", ...CORS });
          res.end(JSON.stringify({ ok: false, error: "Unknown route: " + route }));
          return;
        }

        // Enrich with server-side metadata before storing
        const entry = Object.assign({}, object, {
          source:    "ai-lab",
          savedAt:   new Date().toISOString(),
          ...(route === "B" && { status:   "pending" }),
          ...(route === "C" && { priority: "HIGH"    })
        });

        appendStore(file, entry);
        const label = LOG_LABELS[route];
        console.log("[action]", label, "→ data/" + file);

        res.writeHead(200, { "Content-Type": "application/json", ...CORS });
        res.end(JSON.stringify({ ok: true, message: label, file: "data/" + file }));
      } catch (e) {
        console.error("[action] error:", e.message);
        res.writeHead(500, { "Content-Type": "application/json", ...CORS });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // ── Static files ────────────────────────────────────────────────────────────
  const urlPath = req.url.split("?")[0];
  const target  = urlPath === "/" ? "/index.html" : urlPath;
  const fp      = path.normalize(path.join(STATIC_DIR, target));

  // Path traversal guard
  if (!fp.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    const ext  = path.extname(fp).toLowerCase();
    const mime = MIME[ext] || "text/plain";
    res.writeHead(200, { "Content-Type": mime, ...CORS });
    res.end(fs.readFileSync(fp));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found: " + target);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("AI Lab running at http://localhost:" + PORT);
  console.log("Data directory: " + DATA_DIR);
});
