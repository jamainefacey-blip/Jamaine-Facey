import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Input() {
  const router = useRouter();
  const [idea, setIdea] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = idea.trim();
    if (!trimmed) return;

    const entry = {
      idea:      trimmed,
      timestamp: new Date().toISOString(),
      pass:      trimmed.length >= 10,
    };
    localStorage.setItem('poos_last', JSON.stringify(entry));
    router.push('/output');
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link href="/" style={s.link}>Dashboard</Link>
        <Link href="/input" style={{ ...s.link, ...s.active }}>Input</Link>
        <Link href="/output" style={s.link}>Output</Link>
        <Link href="/status" style={s.link}>Status</Link>
      </nav>

      <h1 style={s.h1}>Submit Idea</h1>

      <form onSubmit={handleSubmit} style={s.form}>
        <textarea
          style={s.textarea}
          rows={5}
          placeholder="Describe your business idea or problem..."
          value={idea}
          onChange={e => setIdea(e.target.value)}
          autoFocus
        />
        <button style={s.btn} type="submit">
          Analyse Idea →
        </button>
      </form>
    </div>
  );
}

const s = {
  page:     { maxWidth: 640, margin: '0 auto', padding: 32, fontFamily: 'monospace', background: '#0d0d1a', color: '#e5e7eb', minHeight: '100vh' },
  nav:      { display: 'flex', gap: 20, marginBottom: 32, borderBottom: '1px solid #1e1e3a', paddingBottom: 12 },
  link:     { color: '#6b7280', textDecoration: 'none', fontSize: 13 },
  active:   { color: '#7c3aed' },
  h1:       { color: '#7c3aed', marginBottom: 24, fontSize: 22 },
  form:     { display: 'flex', flexDirection: 'column', gap: 12 },
  textarea: { background: '#111128', border: '1px solid #1e1e3a', color: '#e5e7eb', padding: 12, borderRadius: 6, fontSize: 14, resize: 'vertical' },
  btn:      { background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start' },
};
