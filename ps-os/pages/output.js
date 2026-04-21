import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

function deriveProjectName(idea) {
  const words = idea.trim().split(/\s+/).slice(0, 5).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function buildResult(entry) {
  const pass = entry.pass;
  return {
    projectName: deriveProjectName(entry.idea),
    status:      pass ? 'PASS' : 'FAIL',
    generated:   pass
      ? `Idea accepted. ${entry.idea.trim().length} chars — sufficient detail to proceed.`
      : `Idea too brief (${entry.idea.trim().length} chars). Minimum 10 characters required.`,
    nextSteps: pass
      ? ['Define scope in Dashboard', 'Create asset → /input', 'Track progress in Status']
      : ['Expand your idea with more detail', 'Return to Input and resubmit'],
  };
}

export default function Output() {
  const router  = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('poos_last');
    if (!raw) { router.replace('/input'); return; }
    try {
      const entry = JSON.parse(raw);
      setResult(buildResult(entry));
    } catch {
      router.replace('/input');
    }
  }, []);

  if (!result) return <div style={{ background: '#0d0d1a', minHeight: '100vh' }} />;

  const pass = result.status === 'PASS';

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link href="/" style={s.link}>Dashboard</Link>
        <Link href="/input" style={s.link}>Input</Link>
        <Link href="/output" style={{ ...s.link, ...s.active }}>Output</Link>
        <Link href="/status" style={s.link}>Status</Link>
      </nav>

      <h1 style={s.h1}>Analysis Result</h1>

      <div style={{ ...s.card, borderColor: pass ? '#059669' : '#dc2626' }}>
        <Row label="Project Name" value={result.projectName} />
        <Row label="Status"       value={result.status} color={pass ? '#059669' : '#dc2626'} />
        <Row label="Generated"    value={result.generated} />

        <div style={s.label}>Next Steps</div>
        <ul style={s.list}>
          {result.nextSteps.map((step, i) => (
            <li key={i} style={s.listItem}>→ {step}</li>
          ))}
        </ul>
      </div>

      <button style={s.btn} onClick={() => router.push('/input')}>
        Submit Another Idea
      </button>
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
  page:     { maxWidth: 640, margin: '0 auto', padding: 32, fontFamily: 'monospace', background: '#0d0d1a', color: '#e5e7eb', minHeight: '100vh' },
  nav:      { display: 'flex', gap: 20, marginBottom: 32, borderBottom: '1px solid #1e1e3a', paddingBottom: 12 },
  link:     { color: '#6b7280', textDecoration: 'none', fontSize: 13 },
  active:   { color: '#7c3aed' },
  h1:       { color: '#7c3aed', marginBottom: 24, fontSize: 22 },
  card:     { border: '1px solid', borderRadius: 8, padding: 24, marginBottom: 24, background: '#111128' },
  row:      { display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  label:    { color: '#6b7280', fontSize: 13, minWidth: 120 },
  value:    { color: '#e5e7eb', fontSize: 13 },
  list:     { margin: '6px 0 0 120px', padding: 0, listStyle: 'none' },
  listItem: { color: '#a78bfa', fontSize: 13, marginBottom: 4 },
  btn:      { background: '#1e1e3a', color: '#e5e7eb', border: '1px solid #374151', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
};
