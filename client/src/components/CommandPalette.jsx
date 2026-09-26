/**
 * CommandPalette.jsx
 *
 * Global Cmd+K / Ctrl+K command palette.
 *
 * - Opens on Cmd+K (Mac) or Ctrl+K (Win/Linux), closes on Escape or backdrop click.
 * - Fuzzy-searches all findings by: rule ID, file basename, and description.
 * - Selecting a result navigates to /issues and highlights that finding.
 *   Navigation is done via a custom event that IssueExplorer listens for.
 * - Keyboard navigation: ↑↓ arrows move through results; Enter selects.
 */

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useScan } from '../context/ScanContext';

// ── Simple fuzzy match ─────────────────────────────────────
// Returns true when every character of `needle` appears in `hay` in order.
function fuzzyMatch(hay, needle) {
  if (!needle) return true;
  const h = hay.toLowerCase();
  const n = needle.toLowerCase();
  let hi = 0;
  for (let ni = 0; ni < n.length; ni++) {
    hi = h.indexOf(n[ni], hi);
    if (hi === -1) return false;
    hi++;
  }
  return true;
}

function matchesFinding(f, query) {
  if (!query.trim()) return true;
  const q = query.trim();
  return (
    fuzzyMatch(f.id,                        q) ||
    fuzzyMatch(f.file.split('/').pop(),     q) ||
    fuzzyMatch(f.description,               q) ||
    fuzzyMatch(f.file,                      q) ||
    fuzzyMatch(f.category,                  q)
  );
}

const SEVERITY_COLORS = {
  high:   '#fca5a5',
  medium: '#fcd34d',
  low:    '#6ee7b7',
};

const CATEGORY_COLORS = {
  'Security':        '#dc2626',
  'Bugs & Logic':    '#e05d2e',
  'Error Handling':  '#c2410c',
  'API & Data Flow': '#7c3aed',
  'Performance':     '#0369a1',
};

// Maximum results to display
const MAX_RESULTS = 12;

// Custom event name used to tell IssueExplorer which finding to select
export const PALETTE_SELECT_EVENT = 'codepulse:palette-select';

// ── Hook: open/close via keyboard ─────────────────────────
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const trigger = isMac
        ? e.metaKey && e.key === 'k'
        : e.ctrlKey && e.key === 'k';

      if (trigger) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return [open, setOpen];
}

// ── Component ──────────────────────────────────────────────
export default function CommandPalette({ open, onClose }) {
  const { findings } = useScan();
  const navigate     = useNavigate();
  const [query,    setQuery]    = useState('');
  const [cursor,   setCursor]   = useState(0);
  const inputRef   = useRef(null);
  const listRef    = useRef(null);

  // Filter findings
  const results = findings
    .filter((f) => matchesFinding(f, query))
    .slice(0, MAX_RESULTS);

  // Reset when opened/closed
  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      // Focus input after paint
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Clamp cursor when results change
  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(results.length - 1, 0)));
  }, [results.length]);

  // Scroll active result into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const selectFinding = useCallback((f) => {
    // Dispatch event so IssueExplorer can pick the finding up
    window.dispatchEvent(new CustomEvent(PALETTE_SELECT_EVENT, { detail: f }));
    navigate('/issues');
    onClose();
  }, [navigate, onClose]);

  function onKeyDown(e) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (e.key === 'Enter' && results[cursor]) {
      selectFinding(results[cursor]);
    }
  }

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="cp-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="cp-modal">
        {/* Search input */}
        <div className="cp-input-wrap">
          <span className="cp-search-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <input
            ref={inputRef}
            className="cp-input"
            type="text"
            placeholder="Search findings by rule, file, or description…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cp-esc-hint">esc</kbd>
        </div>

        {/* Results list */}
        <div className="cp-results" ref={listRef} role="listbox">
          {findings.length === 0 && (
            <div className="cp-empty">No findings loaded. Run a scan first.</div>
          )}

          {findings.length > 0 && results.length === 0 && (
            <div className="cp-empty">No findings match "{query}"</div>
          )}

          {results.map((f, idx) => {
            const isActive = idx === cursor;
            const catColor = CATEGORY_COLORS[f.category] || '#6b7280';
            const sevColor = SEVERITY_COLORS[f.severity] || '#9ca3af';
            return (
              <button
                key={`${f.id}:${f.file}:${f.line}`}
                role="option"
                aria-selected={isActive}
                data-active={isActive}
                className={`cp-result${isActive ? ' cp-result--active' : ''}`}
                onMouseEnter={() => setCursor(idx)}
                onMouseDown={(e) => { e.preventDefault(); selectFinding(f); }}
                type="button"
              >
                <span className="cp-result-left">
                  <span className="cp-result-id">{f.id}</span>
                  <span className="cp-result-desc">{f.description}</span>
                  <span className="cp-result-loc">
                    {f.file.split('/').pop()}
                    <span className="cp-result-line">:{f.line}</span>
                  </span>
                </span>
                <span className="cp-result-right">
                  <span className="cp-result-sev" style={{ color: sevColor }}>
                    {f.severity}
                  </span>
                  <span className="cp-result-cat" style={{ color: catColor }}>
                    {f.category}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="cp-footer">
          <span className="cp-hint"><kbd>↑↓</kbd> navigate</span>
          <span className="cp-hint"><kbd>↵</kbd> open in Issue Explorer</span>
          <span className="cp-hint"><kbd>esc</kbd> close</span>
          {results.length > 0 && (
            <span className="cp-result-count">{results.length} of {findings.length}</span>
          )}
        </div>
      </div>
    </div>
  );
}
