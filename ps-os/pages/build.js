import { useState } from 'react';

export default function Build() {
  const [input,    setInput]    = useState('');
  const [preview,  setPreview]  = useState(null);
  const [full,     setFull]     = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [paywall,  setPaywall]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setFull(null);
    setUnlocked(false);
    setPaywall(false);

    try {
      const res  = await fetch('/api/ava', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ input: input.trim(), sessionId: 'build-session' }),
      });
      const data = await res.json();

      if (data.paywallRequired) {
        setPaywall(true);
        setPreview(data.preview);
        return;
      }

      setPreview(data.preview);
      setFull(data.full);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <h1 style={s.h1}>AVA — Build System</h1>

      <form onSubmit={handleSubmit} style={s.form}>
        <textarea
          style={s.textarea}
          rows={4}
          placeholder="Describe your business problem..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button style={s.btn} type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Submit to AVA'}
        </button>
      </form>

      {error && <div style={s.error}>Error: {error}</div>}

      {paywall && preview && (
        <div style={s.section}>
          <p style={s.spoken}>{preview.spoken}</p>
          <p style={s.muted}>{preview.written}</p>
          <div style={s.paywallBox}>
            <strong>Usage limit reached.</strong> Upgrade to continue.
          </div>
        </div>
      )}

      {preview && !paywall && (
        <div style={s.section}>
          <h2 style={s.h2}>Preview</h2>
          <p style={s.spoken}>{preview.spoken}</p>
          <pre style={s.pre}>{preview.written}</pre>
          {preview.redirectHint && (
            <p style={s.hint}>{preview.redirectHint}</p>
          )}

          {!unlocked ? (
            <div style={s.lock}>
              <span>Full output is locked</span>
              <button style={s.unlockBtn} onClick={() => setUnlocked(true)}>
                Unlock Full System
              </button>
            </div>
          ) : (
            full && (
              <div style={s.fullBlock}>
                <h2 style={s.h2}>Full Output</h2>
                <pre style={s.pre}>{full.written}</pre>
                <div style={s.meta}>
                  <span>Intent: {full.intent}</span>
                  <span>Confidence: {(full.confidence * 100).toFixed(0)}%</span>
                </div>
                {full.actions?.length > 0 && (
                  <div>
                    <strong>Actions:</strong>
                    <pre style={s.pre}>{JSON.stringify(full.actions, null, 2)}</pre>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  page:       { maxWidth: 720, margin: '0 auto', padding: 24, fontFamily: 'monospace', background: '#0d0d1a', color: '#e5e7eb', minHeight: '100vh' },
  h1:         { color: '#7c3aed', marginBottom: 24 },
  h2:         { color: '#a78bfa', marginTop: 24 },
  form:       { display: 'flex', flexDirection: 'column', gap: 12 },
  textarea:   { background: '#111128', border: '1px solid #1e1e3a', color: '#e5e7eb', padding: 10, borderRadius: 6, fontSize: 14, resize: 'vertical' },
  btn:        { background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start' },
  section:    { marginTop: 32 },
  spoken:     { color: '#a78bfa', fontSize: 16, marginBottom: 8 },
  pre:        { background: '#111128', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 13, color: '#d1d5db' },
  muted:      { color: '#6b7280', fontSize: 13 },
  hint:       { color: '#f59e0b', fontSize: 13, marginTop: 8 },
  lock:       { display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, padding: 12, background: '#1e1e3a', borderRadius: 6 },
  unlockBtn:  { background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' },
  fullBlock:  { marginTop: 16, borderTop: '1px solid #1e1e3a', paddingTop: 16 },
  meta:       { display: 'flex', gap: 24, color: '#6b7280', fontSize: 12, marginTop: 8 },
  paywallBox: { marginTop: 16, padding: 16, background: '#1a0a0a', border: '1px solid #dc2626', borderRadius: 6, color: '#fca5a5' },
  error:      { marginTop: 16, color: '#f87171' },
};
