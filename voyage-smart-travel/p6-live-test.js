'use strict';
/**
 * P6-LIVE-01 — Live Mode Browser Validation
 * Tests live API path, fallback safety, and schema stability.
 * Run from voyage-smart-travel directory.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const BASE          = 'http://localhost:7654/#trip-request';
const MOCK_ENDPOINT = 'http://127.0.0.1:7700';

const RESULTS = [];
let passed = 0;
let failed = 0;

function record(label, ok, detail) {
  const icon = ok ? 'PASS' : 'FAIL';
  RESULTS.push({ icon, label, detail: detail || '' });
  if (ok) passed++; else failed++;
}

async function submitTrip(page, fields, config) {
  await page.goto(BASE);
  await page.waitForSelector('#trip-request-form');

  if (fields.origin)       await page.fill('#tr-origin',      fields.origin);
  if (fields.destination)  await page.fill('#tr-destination', fields.destination);
  if (fields.departureDate)await page.fill('#tr-departure',   fields.departureDate);

  if (fields.tripType === 'one_way') {
    await page.locator('label.trip-type-opt', { hasText: 'One-way' }).click();
  } else if (fields.returnDate) {
    await page.fill('#tr-return', fields.returnDate);
  }

  if (fields.travellerType) await page.selectOption('#tr-traveller-type', fields.travellerType);
  if (fields.purpose)       await page.selectOption('#tr-purpose',        fields.purpose);

  if (fields.accessibilityNeeds) {
    for (const need of fields.accessibilityNeeds) {
      await page.locator(`label.access-check:has(input[value="${need}"])`).click();
    }
  }

  await Promise.all([
    page.click('#trip-submit-btn'),
    page.waitForSelector('#trip-result-panel .eval-panel', { timeout: 10000 }),
  ]);
  await page.waitForTimeout(500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  let crashed = null;

  try {

  // ════════════════════════════════════════════════════════════════
  // LIVE MODE — TC1: London (low-risk, expect APPROVED from live API)
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ LIVE TC1: London — live API call, expect APPROVED ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    const networkCalls = [];

    page.on('request', req => {
      if (req.url().includes('7700')) networkCalls.push(req.url());
    });
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push('LTC1: ' + msg.text()); });
    page.on('pageerror', err => consoleErrors.push('LTC1 pageerror: ' + err.message));

    await page.addInitScript((endpoint) => {
      window.VST_CONFIG = { avaApiKey: 'test-key-live-p6', avaEndpoint: endpoint, avaSecureEndpoint: false };
    }, MOCK_ENDPOINT);

    await submitTrip(page, {
      origin: 'New York', destination: 'London',
      departureDate: '2026-05-01', returnDate: '2026-05-08',
      travellerType: 'business', purpose: 'conference',
    });

    // 1a. Network call was made to mock endpoint
    record('LTC1 — HTTP request made to live endpoint', networkCalls.length > 0, 'calls=' + networkCalls.length);

    // 1b. p6-panel present
    const p6Exists = await page.isVisible('.p6-panel');
    record('LTC1 — p6-panel rendered', p6Exists);

    // 1c. Risk badge — Low risk (from live response)
    const riskText = await page.textContent('.risk-low').catch(() => '');
    record('LTC1 — risk badge LOW from live response', riskText.includes('Low'), 'text="' + riskText + '"');

    // 1d. Approval badge — Approved
    const apprText = await page.textContent('.appr-approved').catch(() => '');
    record('LTC1 — approval APPROVED from live response', apprText.includes('Approved'), 'text="' + apprText + '"');

    // 1e. sourceMode = live_claude — green dot present
    const liveDotCount = await page.locator('.p6-source-dot--live').count();
    record('LTC1 — green live dot rendered', liveDotCount > 0, 'live-dot=' + liveDotCount);

    // 1f. Source label says "live intelligence"
    const sourceText = await page.textContent('.p6-source').catch(() => '');
    record('LTC1 — source label "live intelligence"', sourceText.includes('live intelligence'), '"' + sourceText.trim() + '"');

    // 1g. Ava brief differs from fallback — contains live text marker
    const avaBody = await page.textContent('.ava-body').catch(() => '');
    const liveSpecificPhrase = 'cleared to proceed immediately';  // unique to mock live response
    record('LTC1 — Ava brief is live text (not fallback)', avaBody.includes(liveSpecificPhrase), '"' + avaBody.slice(0, 80) + '…"');

    // 1h. Cost band from live response ($1,800 – $2,400)
    const costBand = await page.textContent('.p6-cost-value').catch(() => '');
    record('LTC1 — cost band from live response', costBand.includes('1,800') || costBand.includes('2,4'), '"' + costBand + '"');

    // 1i. No console errors
    const tc1Errors = consoleErrors.filter(e => e.startsWith('LTC1'));
    record('LTC1 — no JS console errors', tc1Errors.length === 0, tc1Errors.join('; ') || 'clean');

    await ctx.close();
  }

  // ════════════════════════════════════════════════════════════════
  // LIVE MODE — TC2: Kabul (high-risk, expect ESCALATED from live API)
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ LIVE TC2: Kabul — live API call, expect ESCALATED ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    const networkCalls = [];

    page.on('request', req => { if (req.url().includes('7700')) networkCalls.push(req.url()); });
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push('LTC2: ' + msg.text()); });
    page.on('pageerror', err => consoleErrors.push('LTC2 pageerror: ' + err.message));

    await page.addInitScript((endpoint) => {
      window.VST_CONFIG = { avaApiKey: 'test-key-live-p6', avaEndpoint: endpoint, avaSecureEndpoint: false };
    }, MOCK_ENDPOINT);

    await submitTrip(page, {
      origin: 'London', destination: 'Kabul',
      departureDate: '2026-06-01', returnDate: '2026-06-10',
      travellerType: 'business', purpose: 'site_inspection',
    });

    // 2a. Network call made
    record('LTC2 — HTTP request made to live endpoint', networkCalls.length > 0, 'calls=' + networkCalls.length);

    // 2b. Risk HIGH
    const riskText = await page.textContent('.risk-high').catch(() => '');
    record('LTC2 — risk badge HIGH from live response', riskText.includes('High'), '"' + riskText + '"');

    // 2c. Approval ESCALATED
    const apprText = await page.textContent('.appr-escalated').catch(() => '');
    record('LTC2 — approval ESCALATED from live response', apprText.includes('Escalated'), '"' + apprText + '"');

    // 2d. Green live dot
    const liveDotCount = await page.locator('.p6-source-dot--live').count();
    record('LTC2 — green live dot rendered', liveDotCount > 0, 'live-dot=' + liveDotCount);

    // 2e. Safety flags — from live response (3 flags in mock)
    const safetyItems = await page.locator('.p6-flags-group--safety .p6-flags-list li').count();
    record('LTC2 — safety flags rendered from live response', safetyItems >= 3, 'safety-items=' + safetyItems);

    // 2f. Docs flags — from live response (4 flags in mock)
    const docItems = await page.locator('.p6-flags-group--docs .p6-flags-list li').count();
    record('LTC2 — docs flags rendered from live response', docItems >= 4, 'doc-items=' + docItems);

    // 2g. Safety flag has danger border (same CSS class regardless of mode)
    const safetyBorder = await page.evaluate(() => {
      const el = document.querySelector('.p6-flags-group--safety');
      return el ? window.getComputedStyle(el).borderLeftColor : 'missing';
    });
    record('LTC2 — safety flag danger border intact in live mode', safetyBorder.includes('239, 68, 68'), 'color=' + safetyBorder);

    // 2h. Ava brief is live-specific escalation text
    const avaBody = await page.textContent('.ava-body').catch(() => '');
    const livePhraseKabul = 'Board Safety Committee';
    record('LTC2 — Ava brief is live escalation text', avaBody.includes(livePhraseKabul), '"' + avaBody.slice(0, 80) + '…"');

    // 2i. Recommended actions — 5 from live response
    const actionsCount = await page.locator('.p6-actions-list li').count();
    record('LTC2 — 5 recommended actions from live response', actionsCount === 5, 'count=' + actionsCount);

    // 2j. No console errors
    const tc2Errors = consoleErrors.filter(e => e.startsWith('LTC2'));
    record('LTC2 — no JS console errors', tc2Errors.length === 0, tc2Errors.join('; ') || 'clean');

    await ctx.close();
  }

  // ════════════════════════════════════════════════════════════════
  // FALLBACK SAFETY — TC3: API key set but server down → fallback fires
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ FALLBACK TC3: API key present, endpoint unreachable → fallback ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push('FTC3: ' + msg.text()); });
    page.on('pageerror', err => consoleErrors.push('FTC3 pageerror: ' + err.message));

    await page.addInitScript(() => {
      window.VST_CONFIG = {
        avaApiKey:        'test-key-fallback-check',
        avaEndpoint:      'http://127.0.0.1:19999',  // nothing listening here
        avaTimeout:       2000,                        // short timeout so test is fast
        avaSecureEndpoint: false,
      };
    });

    await submitTrip(page, {
      origin: 'London', destination: 'Paris',
      departureDate: '2026-07-01', returnDate: '2026-07-05',
      travellerType: 'business', purpose: 'business_meeting',
    });

    // Fallback should fire — eval-panel must render
    const evalVisible = await page.isVisible('.eval-panel');
    record('FTC3 — eval-panel renders when API unreachable', evalVisible);

    // Deterministic source indicator
    const sourceText = await page.textContent('.p6-source').catch(() => '');
    record('FTC3 — fallback source indicator shown', sourceText.includes('deterministic'), '"' + sourceText.trim() + '"');

    // No live dot
    const liveDotCount = await page.locator('.p6-source-dot--live').count();
    record('FTC3 — no live dot when fallback fired', liveDotCount === 0, 'live-dot=' + liveDotCount);

    // No undefined / NaN
    const pageContent = await page.content();
    const hasUndef = pageContent.includes('>undefined<') || pageContent.includes('="undefined"');
    record('FTC3 — no undefined in rendered output', !hasUndef);

    // Exclude expected "connection refused" network errors (unreachable endpoint is intentional)
    const tc3Errors = consoleErrors.filter(e => e.startsWith('FTC3') && !e.includes('ERR_CONNECTION_REFUSED') && !e.includes('Failed to load resource'));
    record('FTC3 — no unexpected JS page errors on fallback', tc3Errors.length === 0, tc3Errors.join('; ') || 'clean');

    await ctx.close();
  }

  // ════════════════════════════════════════════════════════════════
  // FALLBACK SAFETY — TC4: No API key at all → pure fallback
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ FALLBACK TC4: No API key → pure deterministic fallback ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', err => consoleErrors.push('FTC4 pageerror: ' + err.message));

    // No VST_CONFIG at all
    await submitTrip(page, {
      origin: 'New York', destination: 'London',
      departureDate: '2026-08-01', returnDate: '2026-08-07',
      travellerType: 'business', purpose: 'conference',
    });

    const evalVisible   = await page.isVisible('.eval-panel');
    const p6Exists      = await page.isVisible('.p6-panel');
    const sourceText    = await page.textContent('.p6-source').catch(() => '');
    const liveDotCount  = await page.locator('.p6-source-dot--live').count();
    const apprText      = await page.textContent('.appr-approved').catch(() => '');
    record('FTC4 — eval-panel renders with no API key', evalVisible);
    record('FTC4 — p6-panel renders in fallback mode', p6Exists);
    record('FTC4 — source indicator: deterministic', sourceText.includes('deterministic'), '"' + sourceText.trim() + '"');
    record('FTC4 — no live dot without API key', liveDotCount === 0, 'live-dot=' + liveDotCount);
    record('FTC4 — fallback correctly approves London', apprText.includes('Approved'), '"' + apprText + '"');

    const tc4Errors = consoleErrors.filter(e => e.startsWith('FTC4'));
    record('FTC4 — no JS page errors', tc4Errors.length === 0, tc4Errors.join('; ') || 'clean');

    await ctx.close();
  }

  // ════════════════════════════════════════════════════════════════
  // STABILITY — TC5: One-way + accessibility in live mode
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ STABILITY TC5: One-way + accessibility in live mode ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', err => consoleErrors.push('STC5 pageerror: ' + err.message));

    await page.addInitScript((endpoint) => {
      window.VST_CONFIG = { avaApiKey: 'test-key-live-p6', avaEndpoint: endpoint, avaSecureEndpoint: false };
    }, MOCK_ENDPOINT);

    await submitTrip(page, {
      origin: '', destination: 'Tokyo',
      departureDate: '2026-09-01', tripType: 'one_way',
      travellerType: 'disabled', purpose: 'conference',
      accessibilityNeeds: ['wheelchair', 'visual'],
    });

    const evalVisible = await page.isVisible('.eval-panel');
    const p6Exists    = await page.isVisible('.p6-panel');
    record('STC5 — eval-panel renders (one-way, accessibility, live mode)', evalVisible);
    record('STC5 — p6-panel renders', p6Exists);

    const pageContent = await page.content();
    const hasUndef = pageContent.includes('>undefined<') || pageContent.includes('="undefined"');
    const hasNaN   = pageContent.includes('>NaN<');
    record('STC5 — no undefined in output', !hasUndef);
    record('STC5 — no NaN in output', !hasNaN);

    // Output schema identical — all key p6 elements present regardless of mode
    const hasCost    = await page.locator('.p6-cost-value').count();
    const hasActions = await page.locator('.p6-actions-list').count();
    const hasSource  = await page.locator('.p6-source').count();
    record('STC5 — p6-cost-value present', hasCost > 0);
    record('STC5 — p6-actions-list present', hasActions > 0);
    record('STC5 — p6-source present', hasSource > 0);

    const tc5Errors = consoleErrors.filter(e => e.startsWith('STC5'));
    record('STC5 — no JS page errors', tc5Errors.length === 0, tc5Errors.join('; ') || 'clean');

    await ctx.close();
  }

  // ════════════════════════════════════════════════════════════════
  // STABILITY — TC6: Live API returns malformed JSON → fallback fires
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ STABILITY TC6: Live API returns invalid JSON → fallback fires ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', err => consoleErrors.push('STC6 pageerror: ' + err.message));

    await page.addInitScript(() => {
      window.VST_CONFIG = { avaApiKey: 'test-key-live-p6', avaSecureEndpoint: false };
      // Override fetch to return malformed JSON
      window.fetch = () => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          content: [{ text: '{ "broken": true, "missingRequiredFields": true }' }]
        }),
      });
    });

    await submitTrip(page, {
      origin: 'Dublin', destination: 'Berlin',
      departureDate: '2026-10-01', returnDate: '2026-10-05',
      travellerType: 'business', purpose: 'business_meeting',
    });

    const evalVisible = await page.isVisible('.eval-panel');
    record('STC6 — eval-panel still renders after invalid API response', evalVisible);

    const sourceText = await page.textContent('.p6-source').catch(() => '');
    record('STC6 — fallback fires when API response fails schema validation', sourceText.includes('deterministic'), '"' + sourceText.trim() + '"');

    const tc6Errors = consoleErrors.filter(e => e.startsWith('STC6'));
    record('STC6 — no JS page errors on schema validation failure', tc6Errors.length === 0, tc6Errors.join('; ') || 'clean');

    await ctx.close();
  }

  } catch (e) { crashed = e; }

  await browser.close();

  // ════════════════════════════════════════════════════════════════
  // RESULTS
  // ════════════════════════════════════════════════════════════════
  console.log('\n');
  RESULTS.forEach(r => {
    const detail = r.detail ? '  [' + r.detail + ']' : '';
    console.log('  ' + r.icon + '  ' + r.label + detail);
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RESULT  ' + passed + ' passed  |  ' + failed + ' failed');
  console.log('═══════════════════════════════════════════════════════');

  if (crashed) {
    console.error('\nCRASH:', crashed.message.split('\n')[0]);
    process.exit(1);
  }
  if (failed > 0) process.exit(1);
})();
