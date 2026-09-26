/**
 * ScanContext.jsx
 *
 * Single source of truth for scan data across all pages.
 * Holds the active project ("before" | "after"), the active scan target
 * (ecommerce | blog | auth), scan results, and loading state.
 *
 * Pages call useScan() to read data; TopBar calls context functions to switch.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

// ── Context shape ──────────────────────────────────────────
const ScanContext = createContext(null);

// Available targets (must match server/routes/scan.js PROJECTS keys)
export const SCAN_TARGETS = [
  { key: 'ecommerce', label: 'sample-ecommerce-api' },
  { key: 'blog',      label: 'sample-blog-api'       },
  { key: 'auth',      label: 'sample-auth-service'   },
];

// ── Provider ───────────────────────────────────────────────
export function ScanProvider({ children }) {
  const [project,        setProject]        = useState('before'); // 'before' | 'after'
  const [target,         setTarget]         = useState('ecommerce'); // which project to scan
  const [findings,       setFindings]       = useState([]);
  const [beforeFindings, setBeforeFindings] = useState([]); // always the "before" set
  const [graph,          setGraph]          = useState(null);
  const [explanations,   setExplanations]   = useState({});
  const [loading,        setLoading]        = useState(true);
  const [scanning,       setScanning]       = useState(false);
  const [error,          setError]          = useState(null);

  // Track latest request to discard stale responses
  const reqIdRef = useRef(0);

  /**
   * Fetch scan data for a given target + project variant.
   * Also fetches the "before" variant in parallel so we always have
   * a baseline to compute FIXED diffs (used in IssueExplorer).
   */
  const fetchScan = useCallback(async (targetKey, projectKey, isRescan = false) => {
    const reqId = ++reqIdRef.current;

    if (isRescan) {
      setScanning(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch the active scan and the "before" baseline in parallel
      const [res, beforeRes] = await Promise.all([
        fetch(`/api/scan?target=${targetKey}&project=${projectKey}`),
        fetch(`/api/scan?target=${targetKey}&project=before`),
      ]);

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      // Parse before data (best-effort — don't fail the whole scan if it errors)
      let beforeData = null;
      if (beforeRes.ok) {
        try { beforeData = await beforeRes.json(); } catch {}
      }

      if (reqId !== reqIdRef.current) return;

      setFindings(data.findings || []);
      setGraph(data.graph || null);
      setExplanations(data.explanations || {});
      setBeforeFindings(beforeData?.findings || data.findings || []);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setError(err.message);
    } finally {
      if (reqId === reqIdRef.current) {
        setLoading(false);
        setScanning(false);
      }
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    fetchScan(target, project, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Toggle between "before" and "after" projects.
   */
  const toggleProject = useCallback(() => {
    const next = project === 'before' ? 'after' : 'before';
    setProject(next);
    fetchScan(target, next, true);
  }, [project, target, fetchScan]);

  /**
   * Switch to a different scan target (project selector dropdown).
   * Resets to "before" so the comparison is always fresh.
   */
  const switchTarget = useCallback((newTarget) => {
    setTarget(newTarget);
    setProject('before');
    fetchScan(newTarget, 'before', true);
  }, [fetchScan]);

  /**
   * Re-scan the current project (same project, fresh fetch).
   */
  const rescan = useCallback(() => {
    fetchScan(target, project, true);
  }, [target, project, fetchScan]);

  return (
    <ScanContext.Provider
      value={{
        project,
        target,
        findings,
        beforeFindings,
        graph,
        explanations,
        loading,
        scanning,
        error,
        toggleProject,
        switchTarget,
        rescan,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────
export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used inside <ScanProvider>');
  return ctx;
}
