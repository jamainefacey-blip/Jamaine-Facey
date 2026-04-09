const TYPE_ICONS = { project: '◈', tool: '⚙', workflow: '⇌', system: '◉' };
const STATUS_COLORS = {
  idea: '#4b5563',
  defined: '#2563eb',
  building: '#d97706',
  active: '#059669',
  monetising: '#7c3aed',
  exit: '#dc2626',
};

export default function Sidebar({ assets, selectedId, onSelect, search, onSearch }) {
  const grouped = { project: [], tool: [], workflow: [], system: [] };
  for (const a of assets) {
    if (grouped[a.type]) grouped[a.type].push(a);
  }

  return (
    <div style={styles.sidebar}>
      <div style={styles.searchWrap}>
        <input
          style={styles.search}
          placeholder="Search assets..."
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      <div style={styles.assetCount}>
        {search.trim()
          ? `${assets.length} result${assets.length !== 1 ? 's' : ''}`
          : `${assets.length} assets`}
      </div>

      {search.trim() ? (
        // Flat list when searching (across types)
        <div style={styles.scrollList}>
          {assets.map(asset => (
            <AssetRow
              key={asset.id}
              asset={asset}
              selected={asset.id === selectedId}
              onClick={() => onSelect(asset.id)}
            />
          ))}
        </div>
      ) : (
        // Grouped by type when browsing
        Object.entries(grouped).map(([type, items]) => {
          if (!items.length) return null;
          return (
            <div key={type}>
              <div style={styles.groupHeader}>
                <span style={styles.groupIcon}>{TYPE_ICONS[type]}</span>
                {type.toUpperCase()}S
                <span style={styles.groupCount}>{items.length}</span>
              </div>
              {items.map(asset => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  selected={asset.id === selectedId}
                  onClick={() => onSelect(asset.id)}
                />
              ))}
            </div>
          );
        })
      )}

      {assets.length === 0 && (
        <div style={styles.empty}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>◌</div>
          <div>No assets yet</div>
          <div style={{ fontSize: 11, marginTop: 4, color: '#4b5563' }}>
            Drop files in /input or use + Ingest
          </div>
        </div>
      )}
    </div>
  );
}

function AssetRow({ asset, selected, onClick }) {
  const statusColor = STATUS_COLORS[asset.status] || '#4b5563';
  return (
    <div style={{ ...styles.row, ...(selected ? styles.rowSelected : {}) }} onClick={onClick}>
      <div style={{ ...styles.statusDot, background: statusColor }} />
      <div style={styles.rowContent}>
        <div style={styles.rowName}>{asset.name}</div>
        <div style={styles.rowMeta}>
          P{asset.priority} · {asset.status}
        </div>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: 240,
    minWidth: 240,
    background: '#0a0a18',
    borderRight: '1px solid #1e1e3a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  searchWrap: { padding: '12px 12px 4px' },
  search: {
    width: '100%',
    background: '#111128',
    border: '1px solid #1e1e3a',
    color: '#e5e7eb',
    padding: '6px 10px',
    borderRadius: 6,
    fontSize: 12,
    boxSizing: 'border-box',
    outline: 'none',
  },
  assetCount: {
    color: '#4b5563',
    fontSize: 11,
    padding: '4px 14px 8px',
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px 4px',
    color: '#6b7280',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
  },
  scrollList: { overflowY: 'auto' },
  groupIcon: { fontSize: 12 },
  groupCount: {
    marginLeft: 'auto',
    background: '#1e1e3a',
    color: '#6b7280',
    borderRadius: 10,
    padding: '1px 6px',
    fontSize: 10,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    cursor: 'pointer',
    borderLeft: '2px solid transparent',
    transition: 'all 0.1s',
  },
  rowSelected: {
    background: '#111128',
    borderLeftColor: '#7c3aed',
  },
  statusDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  rowContent: { overflow: 'hidden' },
  rowName: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rowMeta: { color: '#4b5563', fontSize: 11, marginTop: 1 },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontSize: 13,
    padding: 24,
    textAlign: 'center',
  },
};
