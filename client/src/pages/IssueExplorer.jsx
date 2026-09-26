import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useScan } from '../context/ScanContext';
import { PALETTE_SELECT_EVENT } from '../components/CommandPalette';

// ── Category colour map ────────────────────────────────────
const CATEGORY_COLOR = {
  'Security':        { accent: '#dc2626', dim: 'rgba(220,38,38,0.12)'  },
  'Bugs & Logic':    { accent: '#e05d2e', dim: 'rgba(224,93,46,0.12)'  },
  'Error Handling':  { accent: '#c2410c', dim: 'rgba(194,65,12,0.12)'  },
  'API & Data Flow': { accent: '#7c3aed', dim: 'rgba(124,58,237,0.12)' },
  'Performance':     { accent: '#0369a1', dim: 'rgba(3,105,161,0.12)'  },
};

const SEVERITY_META = {
  high:   { label: 'High',   cls: 'ie-badge ie-badge--high'   },
  medium: { label: 'Medium', cls: 'ie-badge ie-badge--medium' },
  low:    { label: 'Low',    cls: 'ie-badge ie-badge--low'    },
};

const CATEGORY_ORDER = [
  'Security', 'Bugs & Logic', 'Error Handling', 'API & Data Flow', 'Performance',
];

function findingKey(f) {
  return `${f.id}:${f.file}:${f.line}`;
}

const DETAIL_SECTIONS = [
  { key: 'where',    label: 'WHERE',    description: 'File, function, or route location',                  ai: false },
  { key: 'evidence', label: 'EVIDENCE', description: 'Code pattern that triggered this finding',            ai: false },
  { key: 'how',      label: 'HOW',      description: 'How this issue can occur through the application flow', ai: true  },
  { key: 'why',      label: 'WHY',      description: 'Why this behaviour is problematic',                   ai: true  },
  { key: 'impact',   label: 'IMPACT',   description: 'Connected components or operations that may be affected', ai: true },
  { key: 'fix',      label: 'FIX',      description: 'Suggested remediation and verification tests',        ai: true  },
];

// Severity filter options
const SEV_FILTERS = ['all', 'high', 'medium', 'low'];

// ── Main component ──────────────────────────────────────────
export default function IssueExplorer() {
  const { findings, beforeFindings, explanations, loading, scanning, error, project } = useScan();
  const [selected,   setSelected]   = useState(null);
  const [sevFilter,  setSevFilter]  = useState('all');   // severity filter

  // Reset on project switch
  useEffect(() => {
    setSelected(null);
    setSevFilter('all');
  }, [project]);

  // Compute the set of fixed finding keys: present in "before" but not in current "after"
  const afterKeys = new Set(findings.map(findingKey));
  const fixedKeys = project === 'after'
    ? new Set(beforeFindings.filter((f) => !afterKeys.has(findingKey(f))).map(findingKey))
    : new Set();

  // Listen for command-palette navigation
  useEffect(() => {
    function onPaletteSelect(e) { setSelected(e.detail); }
    window.addEventListener(PALETTE_SELECT_EVENT, onPaletteSelect);
    return () => window.removeEventListener(PALETTE_SELECT_EVENT, onPaletteSelect);
  }, []);

  const isLoading = loading || scanning;

  // Auto-select first finding on load
  useEffect(() => {
    if (!isLoading && !selected && findings.length > 0) setSelected(findings[0]);
  }, [isLoading, findings, selected]);

  // Apply severity filter
  const visibleFindings = sevFilter === 'all'
    ? findings
    : findings.filter((f) => f.severity === sevFilter);

  // Severity counts for filter badges
  const counts = {
    all:    findings.length,
    high:   findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low:    findings.filter((f) => f.severity === 'low').length,
  };

  // When viewing "after", also include fixed findings (from before) in the grouped list
  // so users can see what was resolved. They'll have a FIXED badge and strikethrough.
  const fixedFindings = project === 'after'
    ? beforeFindings.filter((f) => fixedKeys.has(findingKey(f)))
    : [];

  // Apply severity filter to fixed findings too
  const visibleFixed = sevFilter === 'all'
    ? fixedFindings
    : fixedFindings.filter((f) => f.severity === sevFilter);

  // Group visible findings by category (active + fixed merged)
  const grouped = {};
  for (const cat of CATEGORY_ORDER) grouped[cat] = [];
  for (const f of visibleFindings) {
    if (grouped[f.category]) grouped[f.category].push({ finding: f, isFixed: false });
    else grouped[f.category] = [{ finding: f, isFixed: false }];
  }
  // Append fixed findings after active ones in each category
  for (const f of visibleFixed) {
    if (grouped[f.category]) grouped[f.category].push({ finding: f, isFixed: true });
    else grouped[f.category] = [{ finding: f, isFixed: true }];
  }

  return (
    <div className="ie-root">
      {/* ── Left panel ───────────────────────────────── */}
      <div className="ie-list-panel">
        {/* Header */}
        <div className="ie-list-header">
          <span className="ie-list-title">Findings</span>
          {findings.length > 0 && (
            <span className="ie-list-count">
              {visibleFindings.length + visibleFixed.length}
            </span>
          )}
        </div>

        {/* ── Severity filter bar ─────────────────────── */}
        {!isLoading && findings.length > 0 && (
          <div className="ie-filter-bar">
            {SEV_FILTERS.map((sev) => (
              <button
                key={sev}
                type="button"
                className={`ie-filter-btn ie-filter-btn--${sev}${sevFilter === sev ? ' ie-filter-btn--active' : ''}`}
                onClick={() => setSevFilter(sev)}
              >
                {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                <span className="ie-filter-count">{counts[sev]}</span>
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="ie-list-loading">
            <div className="ie-spinner" />
            <span>{scanning ? 'Re-scanning…' : 'Loading…'}</span>
          </div>
        )}

        {error && <div className="ie-list-error">⚠ {error}</div>}

        {!isLoading && !error && findings.length === 0 && (
          <div className="ie-list-empty">No findings. Run a scan first.</div>
        )}

        {!isLoading && !error && findings.length > 0 && visibleFindings.length === 0 && (
          <div className="ie-list-empty">No {sevFilter}-severity findings.</div>
        )}

        {!isLoading && CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          const col = CATEGORY_COLOR[cat] || { accent: '#6b7280', dim: 'rgba(107,114,128,0.12)' };

          return (
            <div key={cat} className="ie-group">
              <div className="ie-group-header" style={{ '--cat-accent': col.accent }}>
                <span className="ie-group-dot" />
                <span className="ie-group-label">{cat}</span>
                <span className="ie-group-count">{items.length}</span>
              </div>

              {items.map(({ finding: f, isFixed }, idx) => {
                    const isActive = selected && findingKey(selected) === findingKey(f);
                    const sev = SEVERITY_META[f.severity] || SEVERITY_META.low;
                    return (
                      <button
                        key={idx}
                        className={[
                          'ie-finding-row',
                          isActive ? 'ie-finding-row--active' : '',
                          isFixed  ? 'ie-finding-row--fixed'  : '',
                        ].filter(Boolean).join(' ')}
                        style={{ '--cat-accent': col.accent, '--cat-dim': col.dim }}
                        onClick={() => !isFixed && setSelected(f)}
                        type="button"
                      >
                        <div className="ie-finding-row-top">
                          <span className={sev.cls}>{sev.label}</span>
                          {isFixed && (
                            <span className="ie-fixed-badge">✓ Fixed</span>
                          )}
                          <span className="ie-finding-rule">{f.id}</span>
                        </div>
                        <div className="ie-finding-desc">{f.description}</div>
                        <div className="ie-finding-loc">
                          {f.file.split('/').pop()}
                          <span className="ie-finding-line">:{f.line}</span>
                        </div>
                      </button>
                    );
                  })}
            </div>
          );
        })}
      </div>

      {/* ── Right panel ──────────────────────────────── */}
      <div className="ie-detail-panel">
        {!selected ? (
          <div className="ie-detail-empty">
            <div className="ie-detail-empty-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M16 10v7m0 3v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <p>Select a finding to inspect it</p>
          </div>
        ) : (
          <DetailPanel
            key={findingKey(selected)}
            finding={selected}
            explanation={explanations[findingKey(selected)] || null}
          />
        )}
      </div>
    </div>
  );
}

// ── Detail panel ────────────────────────────────────────────
// key={findingKey(selected)} on the parent forces a remount (and thus
// the entry animation) whenever a new finding is selected.
function DetailPanel({ finding, explanation }) {
  const col = CATEGORY_COLOR[finding.category] || { accent: '#6b7280', dim: 'rgba(107,114,128,0.12)' };
  const sev = SEVERITY_META[finding.severity] || SEVERITY_META.low;

  // Which section keys are collapsed — starts fully open
  const [collapsed, setCollapsed] = useState(new Set());

  const toggleSection = useCallback((key) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className="ie-detail-inner ie-detail-enter">
      {/* ── Header ─────────────────────────────────── */}
      <div className="ie-detail-header">
        <div className="ie-detail-header-top">
          <span className={sev.cls}>{sev.label}</span>
          <span className="ie-detail-rule-id">{finding.id}</span>
          <span
            className="ie-detail-category"
            style={{ color: col.accent, background: col.dim }}
          >
            {finding.category}
          </span>
        </div>
        <h2 className="ie-detail-title">{finding.description}</h2>
      </div>

      {/* ── Sections ───────────────────────────────── */}
      <div className="ie-sections">
        {DETAIL_SECTIONS.map(({ key, label, description, ai }) => {
          const isCollapsed = collapsed.has(key);
          return (
            <section key={key} className={`ie-section${isCollapsed ? ' ie-section--collapsed' : ''}`}>
              {/* Clickable label row toggles collapse */}
              <button
                type="button"
                className="ie-section-label ie-section-label--btn"
                onClick={() => toggleSection(key)}
                aria-expanded={!isCollapsed}
              >
                <span
                  className="ie-section-tag"
                  style={{ color: col.accent, borderColor: col.accent }}
                >
                  {label}
                </span>
                <span className="ie-section-desc">{description}</span>
                <span className="ie-section-chevron" aria-hidden="true">
                  {isCollapsed ? '›' : '⌄'}
                </span>
              </button>

              {!isCollapsed && (
                <div className="ie-section-body ie-section-body--visible">
                  {key === 'where' && <WhereBlock finding={finding} />}

                  {key === 'evidence' && (
                    <EvidenceBlock
                      snippet={finding.snippet}
                      file={finding.file}
                      line={finding.line}
                    />
                  )}

                  {ai && key !== 'fix' && (
                    explanation
                      ? <ExplanationText text={explanation[key]} />
                      : <PendingBlock />
                  )}

                  {ai && key === 'fix' && (
                    explanation?.fix
                      ? <FixBlock fix={explanation.fix} accent={col.accent} />
                      : <PendingBlock />
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ── WHERE block ─────────────────────────────────────────────
function WhereBlock({ finding }) {
  return (
    <div className="ie-where-block">
      <div className="ie-where-row">
        <span className="ie-where-key">File</span>
        <code className="ie-where-val">{finding.file}</code>
      </div>
      <div className="ie-where-row">
        <span className="ie-where-key">Line</span>
        <code className="ie-where-val">{finding.line}</code>
      </div>
      <div className="ie-where-row">
        <span className="ie-where-key">Rule</span>
        <code className="ie-where-val">{finding.id}</code>
      </div>
    </div>
  );
}

// ── EVIDENCE block with copy button ─────────────────────────
function EvidenceBlock({ snippet, file, line }) {
  const filename = file.split('/').pop();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="ie-evidence-block">
      <div className="ie-evidence-chrome">
        <span className="ie-evidence-filename">{filename}</span>
        <span className="ie-evidence-lineno">line {line}</span>
        <button
          type="button"
          className={`ie-copy-btn${copied ? ' ie-copy-btn--copied' : ''}`}
          onClick={handleCopy}
          title="Copy snippet"
          aria-label="Copy code snippet"
        >
          {copied ? (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M4 3.5V2.5A1.5 1.5 0 015.5 1h5A1.5 1.5 0 0112 2.5v5A1.5 1.5 0 0110.5 9H9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          )}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="ie-evidence-code"><code>{snippet}</code></pre>
    </div>
  );
}

// ── Plain text explanation (HOW / WHY / IMPACT) ─────────────
function ExplanationText({ text }) {
  if (!text) return <PendingBlock />;
  return <p className="ie-explanation-text">{text}</p>;
}

// ── FIX block ───────────────────────────────────────────────
function FixBlock({ fix, accent }) {
  return (
    <div className="ie-fix-block">
      <p className="ie-explanation-text">{fix.remediation}</p>

      {fix.codeChange && (
        <div className="ie-fix-code-wrap">
          <div className="ie-fix-code-chrome">
            <span className="ie-fix-code-label">Suggested change</span>
          </div>
          <pre className="ie-fix-code"><code>{fix.codeChange}</code></pre>
        </div>
      )}

      {fix.tests && fix.tests.length > 0 && (
        <div className="ie-fix-tests">
          <div className="ie-fix-tests-label" style={{ color: accent }}>
            Verification tests
          </div>
          <ol className="ie-fix-tests-list">
            {fix.tests.map((t, i) => (
              <li key={i} className="ie-fix-test-item">{t}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ── Pending AI block ────────────────────────────────────────
function PendingBlock() {
  return (
    <div className="ie-ai-pending">
      <span className="ie-ai-pending-icon">✦</span>
      Pending AI analysis
    </div>
  );
}
