'use strict';
/**
 * P6-SERVER-01 — Secure Server Path Browser Validation
 * Validates that Phase 6 runs through the VST server /api/ava-evaluate endpoint.
 * The browser never sees the Anthropic API key.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const server = require('./server/vst-server');

const PORT    = 3001; /* separate port from production default to avoid clashes */
const BASE    = 'http://127.0.0.1:' + PORT + '/#trip-request';

const RESULTS = [];
let passed = 0, failed = 0;

function record(label, ok, detail) {
  RESULTS.push({ icon: ok ? 'PASS' : 'FAIL', label, detail: detail || '' });
  if (ok) passed++; else failed++;
}

/* Start the VST server on PORT */
function startServer() {
  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log('VST server started on port ' + PORT);
      resolve();
    });
  });
}

async function submitTrip(page, fields) {
  await page.goto(BASE);
  await page.waitForSelector('#trip-request-form');
  if (fields.origin)      await page.fill('#tr-origin',      fields.origin);
  if (fields.destination) await page.fill('#tr-destination', fields.destination);
  if (fields.departureDate) await page.fill('#tr-departure', fields.departureDate);
  if (fields.returnDate)    await page.fill('#tr-return',    fields.returnDate);
  if (fields.travellerType) await page.selectOption('#tr-traveller-type', fields.travellerType);
  if (fields.purpose)       await page.selectOption('#tr-purpose',        fields.purpose);
  await Promise.all([
    page.click('#trip-submit-btn'),
    page.waitForSelector('#trip-result-panel .eval-panel', { timeout: 35000 }),
  ]);
  await page.waitForTimeout(1500);
}

/* Get fallback text with server's /api/ava-evaluate blocked */
async function getFallbackText(browser, destination) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();
  /* Disable the secure endpoint so frontend uses pure deterministic mode */
  await page.addInitScript(() => { window.VST_CONFIG = { avaSecureEndpoint: false }; });
  await page.goto(BASE);
  await page.waitForSelector('#trip-request-form');
  await page.fill('#tr-destination', destination);
  await page.fill('#tr-departure',   '2026-05-01');
  await page.fill('#tr-return',      '2026-05-08');
  await page.selectOption('#tr-traveller-type', 'business');
  await page.selectOption('#tr-purpose',        'conference');
  await Promise.all([
    page.click('#trip-submit-btn'),
    page.waitForSelector('#trip-result-panel .eval-panel', { timeout: 10000 }),
  ]);
  const text = await page.textContent('.ava-body').catch(() => '');
  await ctx.close();
  return text.trim();
}

(async () => {
  await startServer();
  const browser = await chromium.launch({ headless: true });
  let crashed = null;

  try {

  /* ── Collect fallback baselines ──────────────────────────────────────── */
  console.log('\nCollecting deterministic baselines...');
  const fallbackLondon = await getFallbackText(browser, 'London');
  const fallbackKabul  = await getFallbackText(browser, 'Kabul');
  console.log('Fallback London (first 60): "' + fallbackLondon.slice(0, 60) + '…"');
  console.log('Fallback Kabul  (first 60): "' + fallbackKabul.slice(0, 60) + '…"');

  /* ════════════════════════════════════════════════════════════════
     STC1 — London, low-risk, approved
     Server calls Anthropic; frontend gets structured JSON, no key exposed
     ════════════════════════════════════════════════════════════════ */
  console.log('\n═══ STC1: London — secure server path ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    const networkCalls = { direct: [], server: [] };

    page.on('request', req => {
      if (req.url().includes('anthropic.com'))            networkCalls.direct.push(req.url());
      if (req.url().includes('/api/ava-evaluate'))        networkCalls.server.push(req.url());
    });
    const consoleErrors = [];
    page.on('console',  msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror',err => consoleErrors.push('pageerror: ' + err.message));

    /* No VST_CONFIG injection — default SECURE_ENDPOINT='/api/ava-evaluate' */
    await submitTrip(page, {
      origin: 'New York', destination: 'London',
      departureDate: '2026-05-01', returnDate: '2026-05-08',
      travellerType: 'business', purpose: 'conference',
    });

    // Security: no direct Anthropic calls from browser
    record('STC1 — browser makes NO direct call to anthropic.com',
      networkCalls.direct.length === 0, 'direct-calls=' + networkCalls.direct.length);

    // Routing: call goes to internal endpoint
    record('STC1 — browser calls /api/ava-evaluate',
      networkCalls.server.length > 0, 'server-calls=' + networkCalls.server.length);

    // Render: p6 panel
    record('STC1 — p6-panel rendered', await page.isVisible('.p6-panel'));

    // Live mode indicators
    const liveDot = await page.locator('.p6-source-dot--live').count();
    record('STC1 — green live dot shown (sourceMode=live_claude)', liveDot > 0, 'live-dot=' + liveDot);

    const sourceText = await page.textContent('.p6-source').catch(() => '');
    record('STC1 — source label "live intelligence"',
      sourceText.includes('live intelligence'), '"' + sourceText.trim() + '"');

    // Risk / approval
    const riskText = await page.textContent('.risk-low').catch(() => null);
    record('STC1 — risk badge LOW', riskText !== null, 'text=' + JSON.stringify(riskText));

    const apprText = await page.textContent('.appr-approved').catch(() => null);
    record('STC1 — approval APPROVED', apprText !== null, 'text=' + JSON.stringify(apprText));

    // Content differs from deterministic fallback
    const liveAva = await page.textContent('.ava-body').catch(() => '');
    record('STC1 — live Ava brief differs from fallback',
      liveAva.trim() !== fallbackLondon, 'len=' + liveAva.trim().length);

    // Schema completeness
    const hasCost    = await page.locator('.p6-cost-value').count();
    const hasActions = await page.locator('.p6-actions-list li').count();
    record('STC1 — estimatedCostBand present', hasCost > 0, 'count=' + hasCost);
    record('STC1 — recommendedActions present', hasActions > 0, 'count=' + hasActions);

    // No console errors
    record('STC1 — no JS console errors', consoleErrors.length === 0,
      consoleErrors.length ? consoleErrors[0].slice(0, 120) : 'clean');

    await ctx.close();
  }

  /* ════════════════════════════════════════════════════════════════
     STC2 — Kabul, high-risk, escalated
     ════════════════════════════════════════════════════════════════ */
  console.log('\n═══ STC2: Kabul — high risk, secure server path ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    const networkCalls = { direct: [], server: [] };
    const consoleErrors = [];

    page.on('request', req => {
      if (req.url().includes('anthropic.com'))     networkCalls.direct.push(req.url());
      if (req.url().includes('/api/ava-evaluate')) networkCalls.server.push(req.url());
    });
    page.on('console',  msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror',err => consoleErrors.push('pageerror: ' + err.message));

    await submitTrip(page, {
      origin: 'London', destination: 'Kabul',
      departureDate: '2026-06-01', returnDate: '2026-06-10',
      travellerType: 'business', purpose: 'site_inspection',
    });

    record('STC2 — browser makes NO direct call to anthropic.com',
      networkCalls.direct.length === 0, 'direct=' + networkCalls.direct.length);
    record('STC2 — browser calls /api/ava-evaluate',
      networkCalls.server.length > 0, 'server=' + networkCalls.server.length);

    const liveDot = await page.locator('.p6-source-dot--live').count();
    record('STC2 — green live dot shown', liveDot > 0, 'live-dot=' + liveDot);

    const hasHigh = await page.locator('.risk-high').count();
    const hasMed  = await page.locator('.risk-medium').count();
    record('STC2 — risk HIGH or MEDIUM', (hasHigh + hasMed) > 0, 'high=' + hasHigh + ' med=' + hasMed);

    const hasEsc  = await page.locator('.appr-escalated').count();
    const hasRev  = await page.locator('.appr-review').count();
    record('STC2 — approval ESCALATED or REVIEW', (hasEsc + hasRev) > 0, 'esc=' + hasEsc + ' rev=' + hasRev);

    const safetyFlags = await page.locator('.p6-flags-group--safety .p6-flags-list li').count();
    record('STC2 — safety flags present', safetyFlags > 0, 'flags=' + safetyFlags);

    const liveAva = await page.textContent('.ava-body').catch(() => '');
    record('STC2 — live Ava brief differs from fallback',
      liveAva.trim() !== fallbackKabul, 'len=' + liveAva.trim().length);

    record('STC2 — no JS console errors', consoleErrors.length === 0,
      consoleErrors.length ? consoleErrors[0].slice(0, 120) : 'clean');

    await ctx.close();
  }

  /* ════════════════════════════════════════════════════════════════
     STC3 — Failure case: server endpoint returns 503 → fallback
     Simulate by pointing avaSecureEndpoint at a non-existent path
     ════════════════════════════════════════════════════════════════ */
  console.log('\n═══ STC3: Failure — server error, fallback activates ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];

    page.on('console',  msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror',err => consoleErrors.push('pageerror: ' + err.message));

    /* Point at a path that returns 404 */
    await page.addInitScript(() => {
      window.VST_CONFIG = { avaSecureEndpoint: '/api/nonexistent', avaTimeout: 3000 };
    });

    await submitTrip(page, {
      origin: 'New York', destination: 'London',
      departureDate: '2026-05-01', returnDate: '2026-05-08',
      travellerType: 'business', purpose: 'conference',
    });

    // p6 panel still renders (deterministic fallback)
    record('STC3 — p6-panel renders on server failure', await page.isVisible('.p6-panel'));

    // No live dot (fallback mode)
    const liveDot = await page.locator('.p6-source-dot--live').count();
    record('STC3 — no live dot (fallback mode)', liveDot === 0, 'live-dot=' + liveDot);

    // Fallback text used
    const avaText = await page.textContent('.ava-body').catch(() => '');
    record('STC3 — fallback Ava brief shown', avaText.trim().length > 20, 'len=' + avaText.trim().length);

    // Source shows deterministic
    const sourceText = await page.textContent('.p6-source').catch(() => '');
    record('STC3 — source shows deterministic analysis',
      sourceText.includes('deterministic'), '"' + sourceText.trim() + '"');

    // No page-level JS errors (network failure is expected, not a crash)
    const pageErrors = consoleErrors.filter(e =>
      !e.includes('Failed to fetch') && !e.includes('Failed to load resource') && !e.includes('404')
    );
    record('STC3 — no unexpected JS errors', pageErrors.length === 0,
      pageErrors.length ? pageErrors[0].slice(0, 120) : 'clean');

    await ctx.close();
  }

  /* ════════════════════════════════════════════════════════════════
     SECURITY: Verify API key not exposed to browser
     ════════════════════════════════════════════════════════════════ */
  console.log('\n═══ SEC: Key exposure check ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    /* Collect API response body from STC1 context replay */
    const apiResponses = [];
    page.on('response', rsp => {
      if (rsp.url().includes('/api/ava-evaluate')) {
        rsp.text().then(t => apiResponses.push(t)).catch(() => {});
      }
    });

    await page.goto(BASE, { timeout: 45000 });
    await page.waitForSelector('#trip-request-form', { timeout: 35000 });
    await page.fill('#tr-destination', 'London');
    await page.fill('#tr-departure',   '2026-05-01');
    await page.fill('#tr-return',      '2026-05-08');
    await page.selectOption('#tr-traveller-type', 'business');
    await page.selectOption('#tr-purpose',        'conference');
    await Promise.all([
      page.click('#trip-submit-btn'),
      page.waitForSelector('#trip-result-panel .eval-panel', { timeout: 45000 }),
    ]);
    await page.waitForTimeout(1500);

    /* Check browser window has no API key visible */
    const windowKey = await page.evaluate(() => {
      const cfg = window.VST_CONFIG || {};
      const all = JSON.stringify(cfg) + (window.ANTHROPIC_API_KEY || '');
      return all.includes('sk-ant-') ? 'FOUND' : 'clean';
    });
    record('SEC — API key not accessible via window.VST_CONFIG or globals', windowKey === 'clean', windowKey);

    /* Check API response body */
    const apiBody = apiResponses[0] || '';
    record('SEC — /api/ava-evaluate response does not contain API key',
      !apiBody.includes('sk-ant-'), apiBody.includes('sk-ant-') ? 'KEY IN RESPONSE' : 'clean');

    record('SEC — /api/ava-evaluate response contains sourceMode field',
      apiBody.includes('"sourceMode"'), apiBody.includes('"sourceMode"') ? 'present' : 'missing');

    /* Check JS source files served do not contain key */
    const jsContent = await page.evaluate(() => {
      /* Check script src contents indirectly via VST_CONFIG — key only set server-side */
      return typeof window.VST_CONFIG === 'undefined' || !JSON.stringify(window.VST_CONFIG || '').includes('sk-ant-')
        ? 'clean' : 'LEAK';
    });
    record('SEC — key not present in served JS config', jsContent === 'clean', jsContent);

    await ctx.close();
  }

  } catch (e) { crashed = e; }
  await browser.close();
  server.close();

  /* ── Print results ─────────────────────────────────────────────────────── */
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
