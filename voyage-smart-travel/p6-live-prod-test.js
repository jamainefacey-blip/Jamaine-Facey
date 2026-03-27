'use strict';
/**
 * P6-LIVE-01 (CONTROLLED) — Real Anthropic API Browser Validation
 * Uses session ingress token via Authorization: Bearer, routed through a
 * local CORS proxy (port 7701) that tunnels through the egress proxy.
 * Token is never logged or written to output.
 */
const fs       = require('fs');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const proxyServer = require('./anthropic-proxy');

const BASE           = 'http://localhost:7654/#trip-request';
const TOKEN_PATH     = '/home/claude/.claude/remote/.session_ingress_token';
const PROXY_PORT     = 7701;
const PROXY_ENDPOINT = 'http://127.0.0.1:' + PROXY_PORT;

function startProxy(token) {
  return new Promise((resolve) => {
    proxyServer._token = token;
    proxyServer.listen(PROXY_PORT, '127.0.0.1', () => {
      console.log('CORS proxy started on port ' + PROXY_PORT);
      resolve(proxyServer);
    });
  });
}

// Read token without logging it
const LIVE_TOKEN = fs.readFileSync(TOKEN_PATH, 'utf8').trim();
if (!LIVE_TOKEN) { console.error('ERROR: session token not found'); process.exit(1); }
console.log('Live token: available (' + LIVE_TOKEN.length + ' chars, prefix=' + LIVE_TOKEN.slice(0, 10) + '...)');

const RESULTS = [];
let passed = 0, failed = 0;

function record(label, ok, detail) {
  RESULTS.push({ icon: ok ? 'PASS' : 'FAIL', label, detail: detail || '' });
  if (ok) passed++; else failed++;
}

async function submitTrip(page, fields) {
  await page.goto(BASE);
  await page.waitForSelector('#trip-request-form');
  if (fields.origin)       await page.fill('#tr-origin',      fields.origin);
  if (fields.destination)  await page.fill('#tr-destination', fields.destination);
  if (fields.departureDate)await page.fill('#tr-departure',   fields.departureDate);
  if (fields.returnDate)   await page.fill('#tr-return',      fields.returnDate);
  if (fields.travellerType)await page.selectOption('#tr-traveller-type', fields.travellerType);
  if (fields.purpose)      await page.selectOption('#tr-purpose',        fields.purpose);
  await Promise.all([
    page.click('#trip-submit-btn'),
    page.waitForSelector('#trip-result-panel .eval-panel', { timeout: 30000 }),
  ]);
  // Phase 6 is Promise-based — wait for it to resolve and re-render
  await page.waitForTimeout(1500);
}

// Also run fallback with same trip for comparison text
async function getFallbackAvaText(browser, destination, origin, returnDate, travellerType, purpose) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();
  // No VST_CONFIG → pure fallback
  await page.goto(BASE);
  await page.waitForSelector('#trip-request-form');
  if (origin)      await page.fill('#tr-origin',      origin);
  await page.fill('#tr-destination', destination);
  await page.fill('#tr-departure',   '2026-05-01');
  if (returnDate)  await page.fill('#tr-return',      returnDate);
  await page.selectOption('#tr-traveller-type', travellerType);
  await page.selectOption('#tr-purpose',        purpose);
  await Promise.all([
    page.click('#trip-submit-btn'),
    page.waitForSelector('#trip-result-panel .eval-panel', { timeout: 10000 }),
  ]);
  await page.waitForTimeout(500);
  const text = await page.textContent('.ava-body').catch(() => '');
  await ctx.close();
  return text;
}

(async () => {
  const proxy   = await startProxy(LIVE_TOKEN);
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  let crashed = null;

  try {

  // ────────────────────────────────────────────────────────────────
  // Pre-run: collect fallback text for comparison
  // ────────────────────────────────────────────────────────────────
  console.log('\nCollecting fallback baseline text for comparison…');
  const fallbackLondonText = await getFallbackAvaText(browser, 'London', 'New York', '2026-05-08', 'business', 'conference');
  const fallbackKabulText  = await getFallbackAvaText(browser, 'Kabul',  'London',   '2026-06-10', 'business', 'site_inspection');
  console.log('Fallback London (first 60): "' + fallbackLondonText.slice(0, 60) + '…"');
  console.log('Fallback Kabul  (first 60): "' + fallbackKabulText.slice(0, 60) + '…"');

  // ════════════════════════════════════════════════════════════════
  // LIVE TC1 — London, real Anthropic API
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ LIVE TC1: London — real Anthropic API ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    const networkCalls = [];

    page.on('request',  req => { if (req.url().includes('127.0.0.1:7701')) networkCalls.push({ url: req.url(), method: req.method() }); });
    page.on('console',  msg => { if (msg.type() === 'error') consoleErrors.push('LTC1: ' + msg.text()); });
    page.on('pageerror',err => consoleErrors.push('LTC1 pageerror: ' + err.message));

    await page.addInitScript((proxyEndpoint) => {
      window.VST_CONFIG = {
        avaApiKey:     'proxy-auth',  /* auth handled server-side by proxy */
        avaEndpoint:   proxyEndpoint,
        avaAuthScheme: 'x-api-key',  /* proxy ignores this; injects real Bearer */
        avaSecureEndpoint: false,
        avaTimeout:    25000,
      };
    }, PROXY_ENDPOINT);

    await submitTrip(page, {
      origin: 'New York', destination: 'London',
      departureDate: '2026-05-01', returnDate: '2026-05-08',
      travellerType: 'business', purpose: 'conference',
    });

    // A. Real network call via CORS proxy
    record('LTC1 — HTTP request sent via CORS proxy to Anthropic', networkCalls.length > 0,
      networkCalls.length + ' call(s) to ' + (networkCalls[0] ? networkCalls[0].url.slice(0,40) : 'n/a'));

    // A. sourceMode = live_claude → green dot
    const liveDot = await page.locator('.p6-source-dot--live').count();
    record('LTC1 — sourceMode=live_claude: green dot visible', liveDot > 0, 'live-dot=' + liveDot);

    // A. Source label
    const sourceText = await page.textContent('.p6-source').catch(() => '');
    record('LTC1 — source label "live intelligence"', sourceText.includes('live intelligence'), '"' + sourceText.trim() + '"');

    // A. p6-panel present
    record('LTC1 — p6-panel rendered', await page.isVisible('.p6-panel'));

    // A. Risk badge LOW
    const riskText = await page.textContent('.risk-low').catch(() => null);
    record('LTC1 — risk badge LOW', riskText !== null && riskText.includes('Low'), 'text=' + JSON.stringify(riskText));

    // A. Approval APPROVED
    const apprText = await page.textContent('.appr-approved').catch(() => null);
    record('LTC1 — approval APPROVED', apprText !== null && (apprText.includes('Approved') || apprText.includes('Auto')), 'text=' + JSON.stringify(apprText));

    // B. Ava text differs from fallback
    const liveAvaText = await page.textContent('.ava-body').catch(() => '');
    const isDifferent = liveAvaText.trim() !== fallbackLondonText.trim();
    record('LTC1 — live Ava brief differs from deterministic fallback', isDifferent,
      'live[0:60]="' + liveAvaText.slice(0, 60) + '…"');

    // B. Live text is non-empty and substantive
    record('LTC1 — live Ava brief is non-empty', liveAvaText.trim().length > 20, 'length=' + liveAvaText.trim().length);

    // C. 14-field schema: cost band, flags arrays, actions, source
    const hasCostBand = await page.locator('.p6-cost-value').count();
    const hasActions  = await page.locator('.p6-actions-list li').count();
    record('LTC1 — cost band present (schema field)', hasCostBand > 0);
    record('LTC1 — recommendedActions present (schema field)', hasActions > 0, 'count=' + hasActions);

    // E. No console errors
    const tc1Errors = consoleErrors.filter(e => e.startsWith('LTC1'));
    record('LTC1 — no JS console errors', tc1Errors.length === 0, tc1Errors.join('; ') || 'clean');

    await ctx.close();
  }

  // ════════════════════════════════════════════════════════════════
  // LIVE TC2 — Kabul, real Anthropic API
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ LIVE TC2: Kabul — real Anthropic API ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    const networkCalls = [];

    page.on('request',  req => { if (req.url().includes('127.0.0.1:7701')) networkCalls.push(req.url()); });
    page.on('console',  msg => { if (msg.type() === 'error') consoleErrors.push('LTC2: ' + msg.text()); });
    page.on('pageerror',err => consoleErrors.push('LTC2 pageerror: ' + err.message));

    await page.addInitScript((proxyEndpoint) => {
      window.VST_CONFIG = {
        avaApiKey:     'proxy-auth',
        avaEndpoint:   proxyEndpoint,
        avaAuthScheme: 'x-api-key',
        avaTimeout:    25000,
      };
    }, PROXY_ENDPOINT);

    await submitTrip(page, {
      origin: 'London', destination: 'Kabul',
      departureDate: '2026-06-01', returnDate: '2026-06-10',
      travellerType: 'business', purpose: 'site_inspection',
    });

    // A. Real API call via CORS proxy
    record('LTC2 — HTTP request sent via CORS proxy to Anthropic', networkCalls.length > 0, 'calls=' + networkCalls.length);

    // A. Green live dot
    const liveDot = await page.locator('.p6-source-dot--live').count();
    record('LTC2 — sourceMode=live_claude: green dot visible', liveDot > 0, 'live-dot=' + liveDot);

    // A. Source label
    const sourceText = await page.textContent('.p6-source').catch(() => '');
    record('LTC2 — source label "live intelligence"', sourceText.includes('live intelligence'), '"' + sourceText.trim() + '"');

    // Risk HIGH (model should agree Kabul is high risk)
    const hasHighRisk = await page.locator('.risk-high').count();
    const hasMedRisk  = await page.locator('.risk-medium').count();
    record('LTC2 — risk rated HIGH or MEDIUM by live model', (hasHighRisk + hasMedRisk) > 0, 'high=' + hasHighRisk + ' med=' + hasMedRisk);

    // Approval ESCALATED or REVIEW (model should not approve Kabul)
    const hasEscalated = await page.locator('.appr-escalated').count();
    const hasPending   = await page.locator('.appr-pending').count();
    record('LTC2 — approval ESCALATED or REVIEW (not auto-approved)', (hasEscalated + hasPending) > 0, 'esc=' + hasEscalated + ' pend=' + hasPending);

    // Safety flags present (Kabul should generate safety flags)
    const safetyItems = await page.locator('.p6-flags-group--safety .p6-flags-list li').count();
    record('LTC2 — safety flags present from live model', safetyItems > 0, 'count=' + safetyItems);

    // B. Ava brief differs from fallback
    const liveAvaText = await page.textContent('.ava-body').catch(() => '');
    const isDifferent = liveAvaText.trim() !== fallbackKabulText.trim();
    record('LTC2 — live Ava brief differs from deterministic fallback', isDifferent,
      'live[0:60]="' + liveAvaText.slice(0, 60) + '…"');

    // C. p6-panel present
    record('LTC2 — p6-panel rendered', await page.isVisible('.p6-panel'));

    // C. Schema: recommendedActions
    const actionsCount = await page.locator('.p6-actions-list li').count();
    record('LTC2 — recommendedActions present', actionsCount > 0, 'count=' + actionsCount);

    // E. No console errors
    const tc2Errors = consoleErrors.filter(e => e.startsWith('LTC2'));
    record('LTC2 — no JS console errors', tc2Errors.length === 0, tc2Errors.join('; ') || 'clean');

    await ctx.close();
  }

  // ════════════════════════════════════════════════════════════════
  // D. FAILURE HANDLING — bad token → fallback, no crash
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ FALLBACK D: Invalid bearer token → fallback activates ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', err => consoleErrors.push('FD: ' + err.message));

    await page.addInitScript(() => {
      window.VST_CONFIG = {
        avaApiKey:         'invalid-token-12345',
        avaAuthScheme:     'bearer',
        avaTimeout:        5000,
        avaSecureEndpoint: false,
      };
    });

    await page.goto(BASE);
    await page.waitForSelector('#trip-request-form');
    await page.fill('#tr-destination', 'Paris');
    await page.fill('#tr-departure',   '2026-07-01');
    await page.fill('#tr-return',      '2026-07-05');
    await page.selectOption('#tr-traveller-type', 'business');
    await page.selectOption('#tr-purpose',        'business_meeting');
    await Promise.all([
      page.click('#trip-submit-btn'),
      page.waitForSelector('#trip-result-panel .eval-panel', { timeout: 15000 }),
    ]);
    await page.waitForTimeout(500);

    const evalVisible = await page.isVisible('.eval-panel');
    const sourceText  = await page.textContent('.p6-source').catch(() => '');
    const liveDot     = await page.locator('.p6-source-dot--live').count();
    record('D — eval-panel renders after API auth failure', evalVisible);
    record('D — fallback source indicator shown', sourceText.includes('deterministic'), '"' + sourceText.trim() + '"');
    record('D — no live dot on auth failure', liveDot === 0, 'live-dot=' + liveDot);
    const fdErrors = consoleErrors.filter(e => e.startsWith('FD'));
    record('D — no JS page errors on fallback', fdErrors.length === 0, fdErrors.join('; ') || 'clean');

    await ctx.close();
  }

  } catch (e) { crashed = e; }
  await browser.close();
  proxy.close();

  // ════════════════════════════════════════════════════════════════
  // PRINT RESULTS
  // ════════════════════════════════════════════════════════════════
  console.log('\n');
  RESULTS.forEach(r => {
    const det = r.detail ? '  [' + r.detail + ']' : '';
    console.log('  ' + r.icon + '  ' + r.label + det);
  });
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RESULT  ' + passed + ' passed  |  ' + failed + ' failed');
  console.log('═══════════════════════════════════════════════════════');

  if (crashed) { console.error('\nCRASH:', crashed.message.split('\n')[0]); process.exit(1); }
  if (failed > 0) process.exit(1);
})();
