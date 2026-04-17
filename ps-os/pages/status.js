import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Status() {
  const [last, setLast] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('poos_last');
    if (raw) {
      try { setLast(JSON.parse(raw)); } catch {}
    }
  }, []);

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link href="/" style={s.link}>Dashboard</Link>
        <Link href="/input" style={s.link}>Input</Link>
        <Link href="/output" style={s.link}>Output</Link>
        <Link href="/status" style={{ ...s.link, ...s.active }}>Status</Link>
      </nav>

      <h1 style={s.h1}>System Status</h1>

      <div style={s.card}>
        <Row label="System"  value="POOS" />
        <Row label="Status"  value="ACTIVE" color="#059669" />
        <Row label="Version" value="v1.0 — Phase 5C" />
        <Row label="Branch"  value="claude/pain-system-os-v1-gwXH2" />

        <div style={s.divider} />

        <Row label="Last Input"  value={last?.idea  || '—'} />
        <Row label="Last Result" value={last?.pass === true ? 'PASS' : last?.pass === false ? 'FAIL' : '—'}
             color={last?.pass === true ? '#059669' : last?.pass === false ? '#dc2626' : '#6b7280'} />
        <Row label="Timestamp"   value={last?.timestamp ? new Date(last.timestamp).toLocaleString() : '—'} />
      </div>

      <div style={s.modules}>
        <div style={s.moduleTitle}>Active Modules</div>
        {[
          'Asset CRUD + Search',
          'File Ingestion + OCR',
          'GitHub Skill Mining',
          'Skill Router + Execution Engine',
          'AVA (requires ANTHROPIC_API_KEY)',
          'Stripe Paywall (requires STRIPE_SECRET_KEY)',
        ].map(m => (
          <div key={m} style={s.module}>✓ {m}</div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}:</span>
      <span style={{ ...s.value, ...(color ? { color } : {}) }}>{value}</span>
    </div>
  );
}

const s = {
  page:        { maxWidth: 640, margin: '0 auto', padding: 32, fontFamily: 'monospace', background: '#0d0d1a', color: '#e5e7eb', minHeight: '100vh' },
  nav:         { display: 'flex', gap: 20, marginBottom: 32, borderBottom: '1px solid #1e1e3a', paddingBottom: 12 },
  link:        { color: '#6b7280', textDecoration: 'none', fontSize: 13 },
  active:      { color: '#7c3aed' },
  h1:          { color: '#7c3aed', marginBottom: 24, fontSize: 22 },
  card:        { border: '1px solid #1e1e3a', borderRadius: 8, padding: 24, marginBottom: 24, background: '#111128' },
  row:         { display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  label:       { color: '#6b7280', fontSize: 13, minWidth: 120 },
  value:       { color: '#e5e7eb', fontSize: 13 },
  divider:     { borderTop: '1px solid #1e1e3a', margin: '16px 0' },
  modules:     { border: '1px solid #1e1e3a', borderRadius: 8, padding: 20, background: '#111128' },
  moduleTitle: { color: '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 12 },
  module:      { color: '#a78bfa', fontSize: 13, marginBottom: 6 },
};
