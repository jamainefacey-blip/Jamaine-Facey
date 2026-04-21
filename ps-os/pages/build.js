import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const SESSION_ID   = 'build-session';
const STORAGE_KEY  = `ava_full_${SESSION_ID}`;

export default function Build() {
  const router = useRouter();

  const [input,       setInput]       = useState('');
  const [preview,     setPreview]     = useState(null);
  const [full,        setFull]        = useState(null);
  const [unlocked,    setUnlocked]    = useState(false);
  const [paywall,     setPaywall]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error,       setError]       = useState(null);

  // On mount: check ?unlocked=true from Stripe success redirect
  useEffect(() => {
    if (router.query.unlocked === 'true') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { preview: p, full: f } = JSON.parse(stored);
          setPreview(p);
          setFull(f);
          setUnlocked(true);
        }
      } catch {}
      // Clean URL
      router.replace('/build', undefined, { shallow: true });
    }
  }, [router.query.unlocked]);

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
        body:    JSON.stringify({ input: input.trim(), sessionId: SESSION_ID }),
      });
      const data = await res.json();

      if (data.paywallRequired) {
        setPaywall(true);
        setPreview(data.preview);
        return;
      }

      setPreview(data.preview);
      setFull(data.full);
      // Persist for post-payment restore
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ preview: data.preview, full: data.full })); } catch {}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock() {
    setRedirecting(true);
    setError(null);
    try {
      const res  = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId: SESSION_ID }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No checkout URL returned');
      }
    } catch (err) {
      setError(err.message);
      setRedirecting(false);
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
          {preview.redirectHint && <p style={s.hint}>{preview.redirectHint}</p>}

          {!unlocked ? (
            <div style={s.lock}>
              <span>Full output is locked</span>
              <button style={s.unlockBtn} onClick={handleUnlock} disabled={redirecting}>
                {redirecting ? 'Redirecting...' : 'Unlock Full System — £29'}
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
