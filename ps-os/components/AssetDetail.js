const TYPE_ICONS = { project: '◈', tool: '⚙', workflow: '⇌', system: '◉' };
const STATUS_COLORS = {
  idea: '#4b5563', defined: '#2563eb', building: '#d97706',
  active: '#059669', monetising: '#7c3aed', exit: '#dc2626',
};

export default function AssetDetail({ asset }) {
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

  const statusColor = STATUS_COLORS[asset.status] || '#4b5563';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
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
        <div style={styles.timestamp}>
          Last updated: {formatDate(asset.last_updated)}
        </div>
      </div>

      {/* Notes */}
      {asset.notes && asset.notes.length > 0 && (
        <Section title="Notes" count={asset.notes.length}>
          <div style={styles.notesList}>
            {asset.notes.map(note => (
              <div key={note.id} style={styles.note}>
                <div style={styles.noteContent}>{note.content}</div>
                <div style={styles.noteMeta}>
                  {note.source && <span style={styles.noteSource}>{note.source}</span>}
                  <span style={styles.noteDate}>{formatDate(note.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

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
  try {
    return new Date(ts + 'Z').toLocaleString();
  } catch {
    return ts;
  }
}

const styles = {
  container: {
    flex: 1,
    padding: 32,
    overflowY: 'auto',
    maxWidth: 860,
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
  },
  header: {
    borderBottom: '1px solid #1e1e3a',
    paddingBottom: 20,
    marginBottom: 24,
  },
  headerTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  typeIcon: { fontSize: 28, color: '#7c3aed' },
  name: { margin: 0, fontSize: 28, fontWeight: 800, color: '#f9fafb' },
  badges: { display: 'flex', gap: 8, marginBottom: 12 },
  badge: {
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  purpose: {
    color: '#9ca3af',
    fontSize: 15,
    lineHeight: 1.6,
    margin: '8px 0 12px',
  },
  timestamp: { color: '#4b5563', fontSize: 11 },
  section: { marginBottom: 28 },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionCount: {
    background: '#1e1e3a',
    color: '#6b7280',
    borderRadius: 10,
    padding: '1px 7px',
    fontSize: 10,
  },
  notesList: { display: 'flex', flexDirection: 'column', gap: 8 },
  note: {
    background: '#111128',
    border: '1px solid #1e1e3a',
    borderRadius: 8,
    padding: '12px 14px',
  },
  noteContent: { color: '#e5e7eb', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  noteMeta: { display: 'flex', gap: 12, marginTop: 6 },
  noteSource: {
    color: '#7c3aed',
    fontSize: 11,
    background: '#7c3aed11',
    padding: '1px 6px',
    borderRadius: 4,
  },
  noteDate: { color: '#4b5563', fontSize: 11 },
  linkGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  linkCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#111128',
    border: '1px solid #1e1e3a',
    borderRadius: 8,
    padding: '8px 12px',
    minWidth: 180,
  },
  linkIcon: { fontSize: 18, color: '#7c3aed' },
  linkName: { color: '#e5e7eb', fontSize: 13, fontWeight: 500 },
  linkType: { color: '#4b5563', fontSize: 11, textTransform: 'capitalize' },
};
