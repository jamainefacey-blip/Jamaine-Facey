import { useState, useEffect } from 'react';

const TYPE_ICONS = { project: '◈', tool: '⚙', workflow: '⇌', system: '◉' };
const STATUS_COLORS = {
  idea: '#4b5563', defined: '#2563eb', building: '#d97706',
  active: '#059669', monetising: '#7c3aed', exit: '#dc2626',
};
const VALID_STATUSES = ['idea', 'defined', 'building', 'active', 'monetising', 'exit'];
const VALID_TYPES = ['project', 'tool', 'workflow', 'system'];

export default function AssetDetail({ asset, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({});
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    setEditing(false);
    setForm({});
    setNotes(asset?.notes || []);
    setNoteText('');
  }, [asset?.id]);

  if (!asset) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◌</div>
        <div style={{ fontSize: 16, color: '#6b7280' }}>Select an asset to view details</div>
        <div style={{ fontSize: 13, color: '#4b5563', marginTop: 8 }}>
          Or drop a file into /input to begin ingestion
        </div>
      </div>
    );
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noteText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add note');
      setNotes(prev => [...prev, data.note]);
      setNoteText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingNote(false);
    }
  }

  function startEdit() {
    setForm({
      name: asset.name,
      type: asset.type,
      status: asset.status,
      priority: asset.priority,
      purpose: asset.purpose || '',
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm({});
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setEditing(false);
      setForm({});
      onUpdated && onUpdated(data.asset);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${asset.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      onDeleted && onDeleted(asset.id);
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  }

  const statusColor = STATUS_COLORS[asset.status] || '#4b5563';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        {editing ? (
          <EditForm form={form} setForm={setForm} />
        ) : (
          <>
            <div style={styles.headerTop}>
              <span style={styles.typeIcon}>{TYPE_ICONS[asset.type] || '◈'}</span>
              <h1 style={styles.name}>{asset.name}</h1>
            </div>
            <div style={styles.badges}>
              <Badge text={asset.type} color="#1e3a5f" />
              <Badge text={asset.status} color={statusColor} />
              <PriorityBadge priority={asset.priority} />
            </div>
            {asset.purpose && <p style={styles.purpose}>{asset.purpose}</p>}
            <div style={styles.timestamp}>Last updated: {formatDate(asset.last_updated)}</div>
          </>
        )}

        {/* Action buttons */}
        <div style={styles.actions}>
          {editing ? (
            <>
              <button
                style={{ ...styles.btn, ...styles.btnSave, ...(saving ? styles.btnDisabled : {}) }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button style={{ ...styles.btn, ...styles.btnCancel }} onClick={cancelEdit}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button style={{ ...styles.btn, ...styles.btnEdit }} onClick={startEdit}>
                Edit
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnDelete, ...(deleting ? styles.btnDisabled : {}) }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      <Section title="Notes" count={notes.length}>
        <div style={styles.notesList}>
          {notes.map(note => (
            <div key={note.id} style={styles.note}>
              <div style={styles.noteContent}>{note.content}</div>
              <div style={styles.noteMeta}>
                {note.source && <span style={styles.noteSource}>{note.source}</span>}
                <span style={styles.noteDate}>{formatDate(note.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={styles.noteInputRow}>
          <textarea
            style={styles.noteInput}
            placeholder="Add a note…"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
            rows={2}
          />
          <button
            style={{ ...styles.btn, ...styles.btnAddNote, ...(addingNote ? styles.btnDisabled : {}) }}
            onClick={handleAddNote}
            disabled={addingNote || !noteText.trim()}
          >
            {addingNote ? '…' : '+ Add'}
          </button>
        </div>
      </Section>

      {/* Linked Assets */}
      {asset.links && asset.links.length > 0 && (
        <Section title="Linked Assets" count={asset.links.length}>
          <div style={styles.linkGrid}>
            {asset.links.map(link => (
              <div key={link.id} style={styles.linkCard}>
                <span style={styles.linkIcon}>{TYPE_ICONS[link.type] || '◈'}</span>
                <div>
                  <div style={styles.linkName}>{link.name}</div>
                  <div style={styles.linkType}>{link.type} · {link.status}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function EditForm({ form, setForm }) {
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  return (
    <div style={styles.editForm}>
      <div style={styles.editRow}>
        <label style={styles.editLabel}>Name</label>
        <input style={styles.editInput} value={form.name || ''} onChange={set('name')} />
      </div>
      <div style={styles.editRow}>
        <label style={styles.editLabel}>Type</label>
        <select style={styles.editSelect} value={form.type || ''} onChange={set('type')}>
          {VALID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={styles.editRow}>
        <label style={styles.editLabel}>Status</label>
        <select style={styles.editSelect} value={form.status || ''} onChange={set('status')}>
          {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={styles.editRow}>
        <label style={styles.editLabel}>Priority</label>
        <select style={styles.editSelect} value={form.priority || 3} onChange={set('priority')}>
          {[1,2,3,4,5].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div style={styles.editRow}>
        <label style={styles.editLabel}>Purpose</label>
        <textarea
          style={{ ...styles.editInput, minHeight: 64, resize: 'vertical' }}
          value={form.purpose || ''}
          onChange={set('purpose')}
        />
      </div>
    </div>
  );
}

function Section({ title, count, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>{title}</span>
        {count != null && <span style={styles.sectionCount}>{count}</span>}
      </div>
      {children}
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{ ...styles.badge, background: color + '33', border: `1px solid ${color}55`, color }}>
      {text}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const colors = ['', '#4b5563', '#2563eb', '#d97706', '#f59e0b', '#ef4444'];
  const color = colors[priority] || '#4b5563';
  return (
    <span style={{ ...styles.badge, background: color + '22', border: `1px solid ${color}44`, color }}>
      {'★'.repeat(priority)}{'☆'.repeat(5 - priority)}
    </span>
  );
}

function formatDate(ts) {
  if (!ts) return '—';
  try { return new Date(ts + 'Z').toLocaleString(); } catch { return ts; }
}

const styles = {
  container: { flex: 1, padding: 32, overflowY: 'auto', maxWidth: 860 },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', color: '#6b7280',
  },
  header: { borderBottom: '1px solid #1e1e3a', paddingBottom: 20, marginBottom: 24 },
  headerTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  typeIcon: { fontSize: 28, color: '#7c3aed' },
  name: { margin: 0, fontSize: 28, fontWeight: 800, color: '#f9fafb' },
  badges: { display: 'flex', gap: 8, marginBottom: 12 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' },
  purpose: { color: '#9ca3af', fontSize: 15, lineHeight: 1.6, margin: '8px 0 12px' },
  timestamp: { color: '#4b5563', fontSize: 11 },
  actions: { display: 'flex', gap: 8, marginTop: 14 },
  btn: { padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' },
  btnEdit:    { background: '#1e1e3a', color: '#9ca3af' },
  btnDelete:  { background: '#7f1d1d', color: '#fca5a5' },
  btnSave:    { background: '#059669', color: '#fff' },
  btnCancel:  { background: '#1e1e3a', color: '#9ca3af' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  editForm: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 4 },
  editRow: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  editLabel: { color: '#6b7280', fontSize: 12, fontWeight: 600, width: 64, paddingTop: 7, flexShrink: 0 },
  editInput: {
    flex: 1, background: '#0d0d1a', border: '1px solid #1e1e3a',
    color: '#e5e7eb', padding: '6px 10px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit',
  },
  editSelect: {
    flex: 1, background: '#0d0d1a', border: '1px solid #1e1e3a',
    color: '#e5e7eb', padding: '6px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
  },
  section: { marginBottom: 28 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' },
  sectionCount: { background: '#1e1e3a', color: '#6b7280', borderRadius: 10, padding: '1px 7px', fontSize: 10 },
  notesList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 },
  noteInputRow: { display: 'flex', gap: 8, alignItems: 'flex-start' },
  noteInput: {
    flex: 1, background: '#0d0d1a', border: '1px solid #1e1e3a',
    color: '#e5e7eb', padding: '8px 10px', borderRadius: 6, fontSize: 13,
    fontFamily: 'inherit', resize: 'none',
  },
  btnAddNote: { background: '#7c3aed', color: '#fff', whiteSpace: 'nowrap', padding: '8px 14px' },
  note: { background: '#111128', border: '1px solid #1e1e3a', borderRadius: 8, padding: '12px 14px' },
  noteContent: { color: '#e5e7eb', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  noteMeta: { display: 'flex', gap: 12, marginTop: 6 },
  noteSource: { color: '#7c3aed', fontSize: 11, background: '#7c3aed11', padding: '1px 6px', borderRadius: 4 },
  noteDate: { color: '#4b5563', fontSize: 11 },
  linkGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  linkCard: {
    display: 'flex', alignItems: 'center', gap: 8, background: '#111128',
    border: '1px solid #1e1e3a', borderRadius: 8, padding: '8px 12px', minWidth: 180,
  },
  linkIcon: { fontSize: 18, color: '#7c3aed' },
  linkName: { color: '#e5e7eb', fontSize: 13, fontWeight: 500 },
  linkType: { color: '#4b5563', fontSize: 11, textTransform: 'capitalize' },
};
