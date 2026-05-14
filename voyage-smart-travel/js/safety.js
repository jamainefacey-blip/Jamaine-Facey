/* safety.js — VST Safety Engine v1.0 */
(function () {
  'use strict';

  /* ── Helpers ────────────────────────────────────────────────────── */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  function riskColor(level) {
    if (level <= 2) return '#22c55e';
    if (level <= 4) return '#00d4aa';
    if (level <= 6) return '#f59e0b';
    if (level <= 8) return '#f97316';
    return '#ef4444';
  }

  function riskLabel(level) {
    if (level <= 2) return 'Very Safe';
    if (level <= 4) return 'Low–Moderate';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High Risk';
    return 'Extreme Risk';
  }

  function womenScoreColor(score) {
    if (score >= 8) return '#22c55e';
    if (score >= 6) return '#00d4aa';
    if (score >= 4) return '#f59e0b';
    return '#ef4444';
  }

  function severityColor(sev) {
    if (sev === 'low') return '#22c55e';
    if (sev === 'medium') return '#f59e0b';
    return '#ef4444';
  }

  /* ── SOS Floating Button ────────────────────────────────────────── */
  function initSOS() {
    const html = `
<div class="sos-fab" id="sos-fab" aria-label="Emergency SOS" role="region">
  <button class="sos-trigger" id="sos-trigger" aria-expanded="false" aria-label="Open emergency panel">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span class="sos-label">SOS</span>
  </button>

  <div class="sos-panel" id="sos-panel" aria-hidden="true">
    <div class="sos-panel-header">
      <div class="sos-panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:18px;height:18px;flex-shrink:0">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Emergency Panel
      </div>
      <button class="sos-close" id="sos-close" aria-label="Close emergency panel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:16px;height:16px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="sos-emergency-row">
      <a class="sos-call-btn" href="tel:112" aria-label="Call emergency services 112">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:20px;height:20px"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>
        <span>Call 112</span>
      </a>
      <div class="sos-local" id="sos-local-num">International emergency</div>
    </div>

    <div class="sos-actions">
      <button class="sos-action-btn" id="sos-location-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:16px;height:16px"><circle cx="12" cy="11" r="3"/><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
        Share My Location
      </button>
      <a class="sos-action-btn" href="/safety#embassies" id="sos-embassy-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:16px;height:16px"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Find Embassy
      </a>
    </div>

    <div class="sos-location-output" id="sos-location-output" aria-live="polite"></div>

    <div class="sos-footer-note">
      Always call local emergency services first.<br>
      999 works from UK mobiles roaming abroad.
    </div>
  </div>
</div>`;

    const container = document.createElement('div');
    container.innerHTML = html.trim();
    document.body.appendChild(container.firstElementChild);

    const fab = $('#sos-fab');
    const trigger = $('#sos-trigger');
    const panel = $('#sos-panel');
    const closeBtn = $('#sos-close');
    const locBtn = $('#sos-location-btn');
    const locOutput = $('#sos-location-output');

    function open() {
      panel.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');
      fab.classList.add('sos-open');
    }

    function close() {
      panel.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      fab.classList.remove('sos-open');
    }

    trigger.addEventListener('click', () => {
      const isOpen = fab.classList.contains('sos-open');
      isOpen ? close() : open();
    });

    closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && fab.classList.contains('sos-open')) close();
    });

    locBtn.addEventListener('click', () => {
      locOutput.textContent = 'Getting location…';
      if (!navigator.geolocation) {
        locOutput.textContent = 'Geolocation not available on this device.';
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(5);
          const lon = pos.coords.longitude.toFixed(5);
          const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
          try {
            navigator.clipboard.writeText(mapsUrl).then(() => {
              locOutput.innerHTML = `<strong>Location copied!</strong><br>${lat}, ${lon}<br><a href="${mapsUrl}" target="_blank" rel="noopener" style="color:var(--teal)">Open in Maps ↗</a>`;
            });
          } catch {
            locOutput.innerHTML = `📍 ${lat}, ${lon}<br><a href="${mapsUrl}" target="_blank" rel="noopener" style="color:var(--teal)">Open in Maps ↗</a>`;
          }
        },
        () => {
          locOutput.textContent = 'Could not get location. Check browser permissions.';
        }
      );
    });

    /* Close when clicking outside */
    document.addEventListener('click', (e) => {
      if (!fab.contains(e.target) && fab.classList.contains('sos-open')) close();
    });
  }

  /* ── Safety Hub — only runs on safety.html ──────────────────────── */
  function isSafetyPage() {
    return !!$('#safety-hub');
  }

  /* Country selector shared utility */
  function buildCountryOptions(selectEl, data) {
    const countries = Object.entries(data)
      .map(([k, v]) => ({ key: k, name: v.country || k }))
      .sort((a, b) => a.name.localeCompare(b.name));

    selectEl.innerHTML = '<option value="">— Select a destination —</option>';
    countries.forEach(({ key, name, flag }) => {
      const opt = document.createElement('option');
      opt.value = key;
      const d = data[key];
      opt.textContent = (d.flag ? d.flag + ' ' : '') + (d.country || name);
      selectEl.appendChild(opt);
    });
  }

  /* Embassy Finder */
  function initEmbassyFinder() {
    const data = window.VST_SAFETY_DATA;
    const sel = $('#embassy-country-select');
    const result = $('#embassy-result');
    if (!sel || !result) return;

    buildCountryOptions(sel, data.embassies);

    sel.addEventListener('change', () => {
      const key = sel.value;
      if (!key) { result.innerHTML = ''; return; }
      const e = data.embassies[key];
      const em = data.emergencyNumbers[key] || {};
      result.innerHTML = `
        <div class="embassy-card">
          <div class="embassy-card-flag">${e.flag || '🏳'}</div>
          <div class="embassy-card-body">
            <h3 class="embassy-card-name">${e.name}</h3>
            <p class="embassy-card-address">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:14px;height:14px;flex-shrink:0;margin-top:2px"><circle cx="12" cy="11" r="3"/><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
              ${e.address}
            </p>
            <div class="embassy-card-contacts">
              <a class="embassy-contact" href="tel:${e.phone}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:14px;height:14px"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>
                ${e.phone}
              </a>
              <a class="embassy-contact" href="mailto:${e.email}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:14px;height:14px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                ${e.email}
              </a>
            </div>
            <div class="embassy-card-row">
              <span class="embassy-card-hours">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:13px;height:13px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${e.hours}
              </span>
            </div>
            ${em.general ? `<div class="embassy-emergency">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:13px;height:13px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Local emergency: <strong>${em.general}</strong>
              ${em.police !== em.general ? ` · Police: <strong>${em.police}</strong>` : ''}
              ${em.ambulance !== em.general ? ` · Ambulance: <strong>${em.ambulance}</strong>` : ''}
            </div>` : ''}
          </div>
        </div>`;
    });
  }

  /* Travel Advisory Section */
  function initAdvisory() {
    const data = window.VST_SAFETY_DATA;
    const sel = $('#advisory-country-select');
    const result = $('#advisory-result');
    if (!sel || !result) return;

    buildCountryOptions(sel, data.advisories);

    sel.addEventListener('change', () => {
      const key = sel.value;
      if (!key) { result.innerHTML = ''; return; }
      const a = data.advisories[key];
      const emb = data.embassies[key] || {};
      const vax = data.vaccinations[key] || {};
      const color = riskColor(a.riskLevel);
      const lvl = riskLabel(a.riskLevel);

      result.innerHTML = `
        <div class="advisory-card">
          <div class="advisory-card-header">
            <div class="advisory-risk-badge" style="--risk-color:${color}">
              <div class="advisory-risk-num">${a.riskLevel}</div>
              <div class="advisory-risk-info">
                <div class="advisory-risk-label">${lvl}</div>
                <div class="advisory-risk-sublabel">out of 10</div>
              </div>
            </div>
            <div class="advisory-country-meta">
              <div class="advisory-country-flag">${emb.flag || '🏳'}</div>
              <h3 class="advisory-country-name">${emb.country || key}</h3>
            </div>
          </div>

          <div class="advisory-categories">
            ${[
              { icon: 'shield', label: 'Safety', text: a.safety },
              { icon: 'heart', label: 'Health', text: a.health },
              { icon: 'file', label: 'Entry Requirements', text: a.entry },
              { icon: 'book', label: 'Local Laws', text: a.laws }
            ].map(cat => `
              <div class="advisory-cat">
                <div class="advisory-cat-label">${cat.label}</div>
                <p class="advisory-cat-text">${cat.text}</p>
              </div>`).join('')}
          </div>

          ${vax.recommended && vax.recommended.length ? `
          <div class="advisory-vax">
            <div class="advisory-vax-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:15px;height:15px"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/></svg>
              Vaccinations
            </div>
            ${vax.required && vax.required.length ? `<div class="advisory-vax-required">Required: <strong>${vax.required.join(', ')}</strong></div>` : ''}
            <div class="advisory-vax-recommended">Recommended: ${vax.recommended.join(' · ')}</div>
            ${vax.notes ? `<div class="advisory-vax-notes">${vax.notes}</div>` : ''}
          </div>` : ''}
        </div>`;
    });
  }

  /* Risk Overview Grid */
  function initRiskGrid() {
    const data = window.VST_SAFETY_DATA;
    const grid = $('#risk-grid');
    if (!grid) return;

    const entries = Object.entries(data.advisories)
      .sort((a, b) => a[1].riskLevel - b[1].riskLevel);

    grid.innerHTML = entries.map(([key, a]) => {
      const emb = data.embassies[key] || {};
      const color = riskColor(a.riskLevel);
      return `
        <div class="risk-card" data-key="${key}" style="--risk-color:${color}" tabindex="0" role="button" aria-label="${emb.country || key} — Risk level ${a.riskLevel}">
          <div class="risk-card-flag">${emb.flag || '🏳'}</div>
          <div class="risk-card-body">
            <div class="risk-card-country">${emb.country || key}</div>
            <div class="risk-card-level" style="color:${color}">${a.riskLevel}/10 — ${riskLabel(a.riskLevel)}</div>
          </div>
          <div class="risk-card-bar">
            <div class="risk-card-fill" style="width:${a.riskLevel * 10}%;background:${color}"></div>
          </div>
        </div>`;
    }).join('');

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.risk-card');
      if (!card) return;
      const key = card.dataset.key;
      const sel = $('#advisory-country-select');
      if (sel) {
        sel.value = key;
        sel.dispatchEvent(new Event('change'));
        document.querySelector('#advisory').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    grid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') e.target.click();
    });
  }

  /* Solo Traveller Mode */
  function initSoloMode() {
    const toggle = $('#solo-toggle');
    const content = $('#solo-content');
    if (!toggle || !content) return;

    const stored = localStorage.getItem('vst-solo-mode') === 'true';
    toggle.checked = stored;
    content.classList.toggle('solo-active', stored);

    toggle.addEventListener('change', () => {
      const on = toggle.checked;
      localStorage.setItem('vst-solo-mode', on);
      content.classList.toggle('solo-active', on);
    });

    /* Check-in reminder */
    const checkInBtn = $('#solo-checkin-btn');
    const checkInStatus = $('#solo-checkin-status');
    if (checkInBtn) {
      const lastCheckin = localStorage.getItem('vst-last-checkin');
      if (lastCheckin) {
        const mins = Math.round((Date.now() - parseInt(lastCheckin)) / 60000);
        checkInStatus.textContent = `Last check-in: ${mins < 60 ? mins + 'm ago' : Math.round(mins / 60) + 'h ago'}`;
      }

      checkInBtn.addEventListener('click', () => {
        localStorage.setItem('vst-last-checkin', Date.now());
        checkInStatus.textContent = 'Checked in just now ✓';
        checkInBtn.textContent = 'Checked In ✓';
        setTimeout(() => { checkInBtn.textContent = 'Check In Now'; }, 3000);
      });
    }
  }

  /* Women Safety Grid */
  function initWomenSafety() {
    const data = window.VST_SAFETY_DATA;
    const grid = $('#women-grid');
    if (!grid) return;

    const entries = Object.entries(data.womenSafety)
      .sort((a, b) => b[1].score - a[1].score);

    grid.innerHTML = entries.map(([key, w]) => {
      const emb = data.embassies[key] || {};
      const color = womenScoreColor(w.score);
      return `
        <div class="women-card">
          <div class="women-card-top">
            <div class="women-card-flag">${emb.flag || '🏳'}</div>
            <div class="women-card-meta">
              <div class="women-card-country">${emb.country || key}</div>
              <div class="women-card-score" style="color:${color}">${w.score}/10 — ${w.label}</div>
            </div>
          </div>
          <div class="women-card-bar">
            <div class="women-card-fill" style="width:${w.score * 10}%;background:${color}"></div>
          </div>
          <ul class="women-card-tips">
            ${w.tips.slice(0, 3).map(t => `<li>${t}</li>`).join('')}
          </ul>
          ${w.dressCode ? `<div class="women-card-dress">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:13px;height:13px;flex-shrink:0"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            Dress: ${w.dressCode}
          </div>` : ''}
        </div>`;
    }).join('');
  }

  /* Scam Alerts */
  function initScams() {
    const data = window.VST_SAFETY_DATA;
    const sel = $('#scam-country-select');
    const grid = $('#scam-grid');
    if (!sel || !grid) return;

    /* Build scam country options from keys that exist in scam data */
    const scamCountries = Object.keys(data.scams).reduce((acc, key) => {
      const emb = data.embassies[key];
      if (emb) acc[key] = emb;
      return acc;
    }, {});
    buildCountryOptions(sel, scamCountries);

    function renderScams(key) {
      const scams = data.scams[key];
      if (!scams || !scams.length) {
        grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">No scam data for this destination.</p>';
        return;
      }
      grid.innerHTML = scams.map(s => {
        const color = severityColor(s.severity);
        return `
          <div class="scam-card">
            <div class="scam-card-header">
              <div class="scam-badge" style="background:${color}20;color:${color};border-color:${color}40">${s.type}</div>
              <div class="scam-severity" style="color:${color}">${s.severity.toUpperCase()} risk</div>
            </div>
            <h4 class="scam-name">${s.name}</h4>
            <p class="scam-desc">${s.description}</p>
            <div class="scam-avoid">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:14px;height:14px;flex-shrink:0;color:var(--teal)"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
              <span>${s.howToAvoid}</span>
            </div>
          </div>`;
      }).join('');
    }

    /* Show all scams on load */
    function renderAll() {
      const allScams = [];
      Object.entries(data.scams).forEach(([key, scams]) => {
        const emb = data.embassies[key] || {};
        scams.forEach(s => allScams.push({ ...s, destFlag: emb.flag || '', destName: emb.country || key }));
      });
      grid.innerHTML = allScams.map(s => {
        const color = severityColor(s.severity);
        return `
          <div class="scam-card">
            <div class="scam-card-header">
              <div style="display:flex;align-items:center;gap:.5rem">
                <span>${s.destFlag}</span>
                <span class="scam-dest">${s.destName}</span>
                <div class="scam-badge" style="background:${color}20;color:${color};border-color:${color}40">${s.type}</div>
              </div>
              <div class="scam-severity" style="color:${color}">${s.severity.toUpperCase()}</div>
            </div>
            <h4 class="scam-name">${s.name}</h4>
            <p class="scam-desc">${s.description}</p>
            <div class="scam-avoid">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:14px;height:14px;flex-shrink:0;color:var(--teal)"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
              <span>${s.howToAvoid}</span>
            </div>
          </div>`;
      }).join('');
    }

    renderAll();

    sel.addEventListener('change', () => {
      const key = sel.value;
      if (!key) { renderAll(); return; }
      renderScams(key);
    });
  }

  /* Medical / Vaccination Section */
  function initMedical() {
    const data = window.VST_SAFETY_DATA;
    const sel = $('#medical-country-select');
    const result = $('#medical-result');
    if (!sel || !result) return;

    buildCountryOptions(sel, data.vaccinations);

    sel.addEventListener('change', () => {
      const key = sel.value;
      if (!key) { result.innerHTML = ''; return; }
      const v = data.vaccinations[key];
      const emb = data.embassies[key] || {};
      if (!v) { result.innerHTML = '<p style="color:var(--text-muted)">No vaccination data available.</p>'; return; }

      result.innerHTML = `
        <div class="medical-card">
          <div class="medical-card-top">
            <span class="medical-flag">${emb.flag || '🏳'}</span>
            <h3 class="medical-country">${emb.country || key}</h3>
          </div>

          ${v.required && v.required.length ? `
          <div class="medical-section medical-required">
            <div class="medical-section-label" style="color:#ef4444">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:14px;height:14px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Required
            </div>
            <ul class="medical-list">${v.required.map(r => `<li style="color:#ef4444">${r}</li>`).join('')}</ul>
          </div>` : ''}

          <div class="medical-section">
            <div class="medical-section-label" style="color:#00d4aa">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:14px;height:14px"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Recommended
            </div>
            <ul class="medical-list">${v.recommended.map(r => `<li>${r}</li>`).join('')}</ul>
          </div>

          ${v.notes ? `<p class="medical-notes">${v.notes}</p>` : ''}

          <div class="medical-disclaimer">
            Always consult your GP or a travel health clinic at least 6–8 weeks before departure. This information is for guidance only and not medical advice.
          </div>
        </div>`;
    });
  }

  /* Section scroll-reveal */
  function initScrollReveal() {
    const els = $$('.safety-section');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('reveal-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(el => io.observe(el));
  }

  /* ── Init ───────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initSOS();

    if (isSafetyPage()) {
      initEmbassyFinder();
      initAdvisory();
      initRiskGrid();
      initSoloMode();
      initWomenSafety();
      initScams();
      initMedical();
      initScrollReveal();
    }
  });
})();
