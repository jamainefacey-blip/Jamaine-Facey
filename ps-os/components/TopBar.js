import { useState } from 'react';

const STATUSES = ['', 'idea', 'defined', 'building', 'active', 'monetising', 'exit'];
const PRIORITIES = ['', '1', '2', '3', '4', '5'];
const TYPES = ['', 'project', 'tool', 'workflow', 'system'];

export default function TopBar({ filters, onFilterChange, onIngest, lastUpdated }) {
  const [ingestText, setIngestText] = useState('');
  const [ingestOpen, setIngestOpen] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  async function handleIngest() {
    if (!ingestText.trim()) return;
    setIngesting(true);
    try {
      await onIngest(ingestText.trim());
      setIngestText('');
      setIngestOpen(false);
    } finally {
      setIngesting(false);
    }
  }

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <span style={styles.title}>PAIN SYSTEM OS</span>
        <span style={styles.version}>v1</span>
      </div>

      <div style={styles.filters}>
        <select
          style={styles.select}
          value={filters.type || ''}
          onChange={e => onFilterChange({ ...filters, type: e.target.value || undefined })}
        >
          <option value="">All Types</option>
          {TYPES.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          style={styles.select}
          value={filters.status || ''}
          onChange={e => onFilterChange({ ...filters, status: e.target.value || undefined })}
        >
          <option value="">All Status</option>
          {STATUSES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          style={styles.select}
          value={filters.priority || ''}
          onChange={e => onFilterChange({ ...filters, priority: e.target.value || undefined })}
        >
          <option value="">All Priority</option>
          {PRIORITIES.slice(1).map(p => <option key={p} value={p}>P{p}</option>)}
        </select>
      </div>

      <div style={styles.right}>
        {lastUpdated && (
          <span style={styles.timestamp}>
            Updated: {new Date(lastUpdated + 'Z').toLocaleTimeString()}
          </span>
        )}
        <button style={styles.ingestBtn} onClick={() => setIngestOpen(!ingestOpen)}>
          + Ingest Text
        </button>
      </div>

      {ingestOpen && (
        <div style={styles.ingestPanel}>
          <textarea
            style={styles.textarea}
            placeholder="Paste conversation, notes, or structured JSON here..."
            value={ingestText}
            onChange={e => setIngestText(e.target.value)}
            rows={6}
          />
          <div style={styles.ingestActions}>
            <button
              style={{ ...styles.btn, ...(ingesting ? styles.btnDisabled : {}) }}
              onClick={handleIngest}
              disabled={ingesting}
            >
              {ingesting ? 'Processing...' : 'Parse & Store'}
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => { setIngestOpen(false); setIngestText(''); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    height: 52,
    background: '#0d0d1a',
    borderBottom: '1px solid #1e1e3a',
    gap: 16,
    position: 'relative',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  left: { display: 'flex', alignItems: 'center', gap: 8 },
  title: { color: '#a855f7', fontWeight: 800, fontSize: 14, letterSpacing: 2 },
  version: { color: '#4b5563', fontSize: 11, fontWeight: 600 },
  filters: { display: 'flex', gap: 8, flex: 1 },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  timestamp: { color: '#4b5563', fontSize: 11 },
  select: {
    background: '#111128',
    border: '1px solid #1e1e3a',
    color: '#9ca3af',
    padding: '4px 8px',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
  ingestBtn: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600,
  },
  ingestPanel: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: 480,
    background: '#111128',
    border: '1px solid #1e1e3a',
    borderRadius: '0 0 8px 8px',
    padding: 16,
    zIndex: 100,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  textarea: {
    width: '100%',
    background: '#0d0d1a',
    border: '1px solid #1e1e3a',
    color: '#e5e7eb',
    padding: 10,
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'monospace',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  ingestActions: { display: 'flex', gap: 8, marginTop: 10 },
  btn: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600,
  },
  btnSecondary: { background: '#1e1e3a' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
};
