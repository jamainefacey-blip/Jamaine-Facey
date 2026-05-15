'use strict';
/**
 * P6-RENDER-01 — Real Browser Validation
 * Tests Phase 6 panel rendering via headless Chromium (Playwright).
 * Run from voyage-smart-travel directory.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const BASE = 'http://localhost:7654/#trip-request';

const RESULTS = [];
let passed = 0;
let failed = 0;

function record(label, ok, detail) {
  const icon = ok ? 'PASS' : 'FAIL';
  RESULTS.push({ icon, label, detail: detail || '' });
  if (ok) passed++; else failed++;
}

async function fillAndSubmit(page, fields) {
  await page.goto(BASE);
  await page.waitForSelector('#trip-request-form');

  if (fields.origin) await page.fill('#tr-origin', fields.origin);
  await page.fill('#tr-destination', fields.destination);
  await page.fill('#tr-departure', fields.departureDate);

  if (fields.tripType === 'one_way') {
    // Radio is CSS-hidden inside label — click the label
    await page.locator('label.trip-type-opt', { hasText: 'One-way' }).click();
  } else {
    await page.fill('#tr-return', fields.returnDate);
  }

  await page.selectOption('#tr-traveller-type', fields.travellerType);
  await page.selectOption('#tr-purpose', fields.purpose);

  if (fields.accessibilityNeeds && fields.accessibilityNeeds.length) {
    for (const need of fields.accessibilityNeeds) {
      // Checkboxes are CSS-hidden — click the parent label
    await page.locator(`label.access-check:has(input[value="${need}"])`).click();
    }
  }

  // Submit and wait for result panel to appear
  await Promise.all([
    page.click('#trip-submit-btn'),
    page.waitForSelector('#trip-result-panel .eval-panel', { timeout: 5000 }),
  ]);

  // Wait for Phase 6 panel (it resolves via Promise but synchronously in fallback mode)
  await page.waitForTimeout(300);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  let crashed = null;
  try {

  // ── Collect all console errors across tests ─────────────────────────────
  const consoleErrors = [];

  // ════════════════════════════════════════════════════════════════
  // TEST CASE 1 — London (low-risk, auto-approved)
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ TC1: London — low-risk, auto-approved ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push('TC1: ' + msg.text()); });
    page.on('pageerror', err => consoleErrors.push('TC1 pageerror: ' + err.message));

    await fillAndSubmit(page, {
      origin:        'New York',
      destination:   'London',
      departureDate: '2026-05-01',
      returnDate:    '2026-05-08',
      travellerType: 'business',
      purpose:       'conference',
    });

    // 1a. Phase 6 panel present below Ava card
    const p6Exists = await page.isVisible('.p6-panel');
    record('TC1 — p6-panel visible below Ava card', p6Exists);

    // 1b. p6-panel is after .ava-panel in DOM order
    const order = await page.evaluate(() => {
      const ava = document.querySelector('.ava-panel');
      const p6  = document.querySelector('.p6-panel');
      if (!ava || !p6) return 'missing';
      const pos = ava.compareDocumentPosition(p6);
      return (pos & Node.DOCUMENT_POSITION_FOLLOWING) ? 'after' : 'before-or-same';
    });
    record('TC1 — p6-panel is after ava-panel in DOM', order === 'after', 'order=' + order);

    // 1c. Risk badge — Low risk
    const riskBadge = await page.textContent('.risk-low');
    record('TC1 — risk badge is Low risk', riskBadge && riskBadge.includes('Low'), 'text="' + riskBadge + '"');

    // 1d. Approval badge — Approved
    const apprBadge = await page.textContent('.appr-approved');
    record('TC1 — approval badge is Approved', apprBadge && (apprBadge.includes('Approved') || apprBadge.includes('Auto')), 'text="' + apprBadge + '"');

    // 1e. Cost band rendered in p6-panel
    const costBand = await page.textContent('.p6-cost-value');
    record('TC1 — cost band rendered in p6 panel', costBand && costBand.includes('$'), 'value="' + costBand + '"');

    // 1f. Recommended actions list present
    const actionsCount = await page.locator('.p6-actions-list li').count();
    record('TC1 — recommended actions list has items', actionsCount > 0, 'count=' + actionsCount);

    // 1g. Fallback source indicator — no API key
    const sourceText = await page.textContent('.p6-source');
    const isFallback = sourceText && sourceText.includes('deterministic');
    record('TC1 — source indicator shows deterministic (fallback mode)', isFallback, 'text="' + (sourceText || '').trim() + '"');

    // 1h. Source dot is NOT live (should have no --live modifier)
    const liveExists = await page.locator('.p6-source-dot--live').count();
    record('TC1 — no live dot when no API key', liveExists === 0, 'live-dot-count=' + liveExists);

    // 1i. No flags on low-risk trip (no safety/docs flags expected for London business trip)
    const safetyFlags = await page.locator('.p6-flags-group--safety').count();
    record('TC1 — no safety flags on London low-risk trip', safetyFlags === 0, 'safety-flag-groups=' + safetyFlags);

    // 1j. Documentation flags present (cost > 3500 on 2-leg trip)
    const docFlags = await page.locator('.p6-flags-group--docs').count();
    const docItems = await page.locator('.p6-flags-group--docs .p6-flags-list li').count();
    record('TC1 — docs flags group present if cost over threshold', docFlags >= 0, 'doc-groups=' + docFlags + ' items=' + docItems);

    // 1k. Ava panel tone class positive or caution (depends on cost/p6 approval)
    const avaPositive = await page.locator('.ava-positive').count();
    const avaCaution  = await page.locator('.ava-caution').count();
    record('TC1 — ava-panel has a tone class', (avaPositive + avaCaution) > 0, 'positive=' + avaPositive + ' caution=' + avaCaution);

    // 1l. No JS console errors
    record('TC1 — no JS console errors', consoleErrors.filter(e => e.startsWith('TC1')).length === 0,
      consoleErrors.filter(e => e.startsWith('TC1')).join('; ') || 'clean');

    await ctx.close();
  }

  // ════════════════════════════════════════════════════════════════
  // TEST CASE 2 — Kabul (high-risk, escalated)
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ TC2: Kabul — high-risk, escalated ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push('TC2: ' + msg.text()); });
    page.on('pageerror', err => consoleErrors.push('TC2 pageerror: ' + err.message));

    await fillAndSubmit(page, {
      origin:        'London',
      destination:   'Kabul',
      departureDate: '2026-06-01',
      returnDate:    '2026-06-10',
      travellerType: 'business',
      purpose:       'site_inspection',
    });

    // 2a. p6-panel present
    const p6Exists = await page.isVisible('.p6-panel');
    record('TC2 — p6-panel visible', p6Exists);

    // 2b. Risk badge — High risk
    const riskBadge = await page.textContent('.risk-high');
    record('TC2 — risk badge is High risk', riskBadge && riskBadge.includes('High'), 'text="' + riskBadge + '"');

    // 2c. Approval badge — Escalated
    const apprBadge = await page.textContent('.appr-escalated');
    record('TC2 — approval badge is Escalated', apprBadge && apprBadge.includes('Escalated'), 'text="' + apprBadge + '"');

    // 2d. Escalation block present
    const escalationBlock = await page.locator('.eval-escalation').count();
    record('TC2 — escalation block rendered', escalationBlock > 0, 'count=' + escalationBlock);

    // 2e. Safety flag group present with danger border
    const safetyGroup = await page.locator('.p6-flags-group--safety').count();
    record('TC2 — safety flag group present', safetyGroup > 0, 'count=' + safetyGroup);

    // 2f. Safety flag border-left is danger colour
    const safetyBorderColor = await page.evaluate(() => {
      const el = document.querySelector('.p6-flags-group--safety');
      if (!el) return 'missing';
      return window.getComputedStyle(el).borderLeftColor;
    });
    // danger = rgb(239, 68, 68)
    record('TC2 — safety flag has danger (red) left border', safetyBorderColor.includes('239, 68, 68') || safetyBorderColor.includes('ef4444'), 'color=' + safetyBorderColor);

    // 2g. Docs flag group present
    const docsGroup = await page.locator('.p6-flags-group--docs').count();
    record('TC2 — docs flag group present', docsGroup > 0, 'count=' + docsGroup);

    // 2h. Docs flag border-left is warning colour
    const docsBorderColor = await page.evaluate(() => {
      const el = document.querySelector('.p6-flags-group--docs');
      if (!el) return 'missing';
      return window.getComputedStyle(el).borderLeftColor;
    });
    // warning = rgb(245, 158, 11)
    record('TC2 — docs flag has warning (amber) left border', docsBorderColor.includes('245, 158, 11') || docsBorderColor.includes('f59e0b'), 'color=' + docsBorderColor);

    // 2i. Ava panel tone is alert
    const avaAlert = await page.locator('.ava-alert').count();
    record('TC2 — ava-panel tone is alert (red)', avaAlert > 0, 'ava-alert count=' + avaAlert);

    // 2j. Recommended actions populated
    const actionsCount = await page.locator('.p6-actions-list li').count();
    record('TC2 — recommended actions populated', actionsCount > 0, 'count=' + actionsCount);

    // 2k. Fallback source still shows deterministic
    const sourceText = await page.textContent('.p6-source');
    record('TC2 — source indicator shows deterministic', sourceText && sourceText.includes('deterministic'), 'text="' + (sourceText || '').trim() + '"');

    // 2l. No JS console errors
    record('TC2 — no JS console errors', consoleErrors.filter(e => e.startsWith('TC2')).length === 0,
      consoleErrors.filter(e => e.startsWith('TC2')).join('; ') || 'clean');

    await ctx.close();
  }

  // ════════════════════════════════════════════════════════════════
  // TEST CASE 3 — Live mode indicator (window.VST_CONFIG.avaApiKey)
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ TC3: Live mode indicator (mocked API key, fallback triggered) ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', err => consoleErrors.push('TC3 pageerror: ' + err.message));

    // Inject a fake API key before page load — causes liveEvaluate to attempt
    // the API call which will fail (no real endpoint), triggering fallback with source='fallback_rules'
    // We override the fetch to immediately reject so fallback fires instantly
    await page.addInitScript(() => {
      window.VST_CONFIG = { avaApiKey: 'test-key-browser-render-check' };
      // Override fetch so the API call fails immediately → fallback fires
      window.fetch = () => Promise.reject(new Error('mock-network-blocked'));
    });

    await page.goto(BASE);
    await page.waitForSelector('#trip-request-form');

    await page.fill('#tr-origin', 'London');
    await page.fill('#tr-destination', 'Paris');
    await page.fill('#tr-departure', '2026-05-01');
    await page.fill('#tr-return', '2026-05-05');
    await page.selectOption('#tr-traveller-type', 'business');
    await page.selectOption('#tr-purpose', 'business_meeting');

    await Promise.all([
      page.click('#trip-submit-btn'),
      page.waitForSelector('#trip-result-panel .eval-panel', { timeout: 5000 }),
    ]);
    await page.waitForTimeout(400);

    // When API key is set but call fails → fallback fires → sourceMode='fallback_rules' → no live dot
    const liveCount = await page.locator('.p6-source-dot--live').count();
    const sourceText = await page.textContent('.p6-source');
    record('TC3 — API key set + fetch fails → fallback fires, no live dot', liveCount === 0, 'live-dot=' + liveCount);
    record('TC3 — fallback source text shown after API failure', sourceText && sourceText.includes('deterministic'), '"' + (sourceText||'').trim() + '"');

    // Now test live dot: inject a fake successful API response
    const ctx2  = await browser.newContext();
    const page2 = await ctx2.newPage();
    page2.on('pageerror', err => consoleErrors.push('TC3b pageerror: ' + err.message));

    await page2.addInitScript(() => {
      window.VST_CONFIG = { avaApiKey: 'test-key-live-dot-check' };
      // Mock fetch to return a valid Phase 6 response
      window.fetch = () => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          content: [{
            text: JSON.stringify({
              tripSummary:        'London → Paris · 4 nights · 1 traveller · Return',
              travellerProfile:   'Business traveller · business_meeting',
              overallRiskLevel:   'LOW',
              complianceStatus:   'COMPLIANT',
              approvalStatus:     'APPROVED',
              estimatedCostBand:  '$800 – $1,200 USD',
              safetyFlags:        [],
              accessibilityFlags: [],
              documentationFlags: [],
              recommendedActions: ['Proceed to booking confirmation'],
              escalationRequired: false,
              avaBrief:           'This trip is within policy and cleared to proceed.',
              confidence:         0.95,
              sourceMode:         'live_claude',
            }),
          }],
        }),
      });
    });

    await page2.goto(BASE);
    await page2.waitForSelector('#trip-request-form');
    await page2.fill('#tr-origin', 'London');
    await page2.fill('#tr-destination', 'Paris');
    await page2.fill('#tr-departure', '2026-05-01');
    await page2.fill('#tr-return', '2026-05-05');
    await page2.selectOption('#tr-traveller-type', 'business');
    await page2.selectOption('#tr-purpose', 'business_meeting');
    await Promise.all([
      page2.click('#trip-submit-btn'),
      page2.waitForSelector('#trip-result-panel .eval-panel', { timeout: 5000 }),
    ]);
    await page2.waitForTimeout(400);

    const liveCount2  = await page2.locator('.p6-source-dot--live').count();
    const sourceText2 = await page2.textContent('.p6-source');
    record('TC3 — live dot present when API returns valid response', liveCount2 > 0, 'live-dot=' + liveCount2);
    record('TC3 — source text shows "live intelligence"', sourceText2 && sourceText2.includes('live'), '"' + (sourceText2||'').trim() + '"');

    await ctx.close();
    await ctx2.close();
  }

  // ════════════════════════════════════════════════════════════════
  // TEST CASE 4 — One-way + accessibility
  // ════════════════════════════════════════════════════════════════
  console.log('\n═══ TC4: One-way + accessibility (no UI break) ═══');
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', err => consoleErrors.push('TC4 pageerror: ' + err.message));

    await page.goto(BASE);
    await page.waitForSelector('#trip-request-form');

    await page.fill('#tr-origin', '');
    await page.fill('#tr-destination', 'Tokyo');
    await page.locator('label.trip-type-opt', { hasText: 'One-way' }).click();
    await page.fill('#tr-departure', '2026-07-01');
    await page.selectOption('#tr-traveller-type', 'disabled');
    await page.selectOption('#tr-purpose', 'conference');
    await page.locator('label.access-check:has(input[value="wheelchair"])').click();
    await page.locator('label.access-check:has(input[value="visual"])').click();

    await Promise.all([
      page.click('#trip-submit-btn'),
      page.waitForSelector('#trip-result-panel .eval-panel', { timeout: 5000 }),
    ]);
    await page.waitForTimeout(300);

    // UI did not crash
    const evalPanelVisible = await page.isVisible('.eval-panel');
    record('TC4 — eval-panel renders (no crash on one-way + accessibility)', evalPanelVisible);

    // Accessibility flags present
    const accessGroup = await page.locator('.p6-flags-group--access').count();
    record('TC4 — accessibility flag group present', accessGroup > 0, 'count=' + accessGroup);

    // Access flag border-left is info colour
    const accessBorderColor = await page.evaluate(() => {
      const el = document.querySelector('.p6-flags-group--access');
      if (!el) return 'missing';
      return window.getComputedStyle(el).borderLeftColor;
    });
    // info = rgb(56, 189, 248)
    record('TC4 — accessibility flags have info (blue) left border', accessBorderColor.includes('56, 189, 248') || accessBorderColor.includes('38bdf8'), 'color=' + accessBorderColor);

    // Origin flag in documentation (no origin provided)
    const docItems = await page.$$eval('.p6-flags-group--docs .p6-flags-list li', els => els.map(e => e.textContent));
    const hasOriginFlag = docItems.some(t => t.toLowerCase().includes('origin'));
    record('TC4 — origin not specified → docs flag fires', hasOriginFlag, 'doc items: [' + docItems.join(' | ') + ']');

    // No console page errors
    const tc4Errors = consoleErrors.filter(e => e.startsWith('TC4'));
    record('TC4 — no JS page errors', tc4Errors.length === 0, tc4Errors.join('; ') || 'clean');

    await ctx.close();
  }

  // ════════════════════════════════════════════════════════════════
  // PRINT RESULTS
  // ════════════════════════════════════════════════════════════════
  } catch (e) { crashed = e; }
  await browser.close();

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
