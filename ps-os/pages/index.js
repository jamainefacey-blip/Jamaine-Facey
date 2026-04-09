import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import AssetDetail from '../components/AssetDetail';
import TopBar from '../components/TopBar';

const POLL_INTERVAL = 5000;

export default function Home() {
  const [assets, setAssets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, setToast] = useState(null);
  const lastUpdatedRef = useRef(null);
  const searchRef = useRef('');
  const abortRef = useRef(null);

  const fetchAssets = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const q = searchRef.current.trim();
    const params = new URLSearchParams();
    if (q) params.set('query', q);
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);

    try {
      const res = await fetch(`/api/assets?${params}`, { signal });
      if (!res.ok) return;
      const { assets } = await res.json();
      setAssets(assets);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('[search]', err.message);
    }
  }, [filters]);

  const fetchAssetDetail = useCallback(async (id) => {
    if (!id) { setSelectedAsset(null); return; }
    try {
      const res = await fetch(`/api/assets/${id}`);
      if (!res.ok) return;
      const { asset } = await res.json();
      setSelectedAsset(asset);
    } catch {}
  }, []);

  // Debounced fetch — immediate for filter changes, 300ms delay for search input
  useEffect(() => {
    searchRef.current = search;
    const delay = search.trim() ? 300 : 0;
    const timer = setTimeout(fetchAssets, delay);
    return () => clearTimeout(timer);
  }, [search, fetchAssets]);

  // Load detail when selection changes
  useEffect(() => { fetchAssetDetail(selectedId); }, [selectedId, fetchAssetDetail]);

  // Polling for updates
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) return;
        const { lastUpdated: lu } = await res.json();
        if (lu && lu !== lastUpdatedRef.current) {
          lastUpdatedRef.current = lu;
          setLastUpdated(lu);
          fetchAssets();
          if (selectedId) fetchAssetDetail(selectedId);
        }
      } catch {}
    }, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [fetchAssets, fetchAssetDetail, selectedId]);

  async function handleIngest(text) {
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source: 'manual-ingest' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ingestion failed');
      showToast(`Ingested ${data.assetIds.length} assets`);
      fetchAssets();
    } catch (err) {
      showToast(`Error: ${err.message}`, true);
    }
  }

  function showToast(msg, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div style={styles.root}>
      <TopBar
        filters={filters}
        onFilterChange={setFilters}
        onIngest={handleIngest}
        lastUpdated={lastUpdated}
      />
      <div style={styles.body}>
        <Sidebar
          assets={assets}
          selectedId={selectedId}
          onSelect={id => setSelectedId(id === selectedId ? null : id)}
          search={search}
          onSearch={setSearch}
        />
        <main style={styles.main}>
          <AssetDetail
            asset={selectedAsset}
            onUpdated={(updated) => {
              setSelectedAsset(updated);
              setAssets(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
              showToast('Asset updated');
            }}
            onDeleted={(id) => {
              setSelectedId(null);
              setSelectedAsset(null);
              setAssets(prev => prev.filter(a => a.id !== id));
              showToast('Asset deleted');
            }}
          />
        </main>
      </div>

      {toast && (
        <div style={{ ...styles.toast, ...(toast.error ? styles.toastError : styles.toastSuccess) }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    background: '#0d0d1a',
  },
  toast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    padding: '10px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    zIndex: 1000,
    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
  },
  toastSuccess: { background: '#059669', color: '#fff' },
  toastError: { background: '#dc2626', color: '#fff' },
};
