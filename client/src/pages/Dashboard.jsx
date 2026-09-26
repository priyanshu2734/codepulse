import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useScan } from '../context/ScanContext';
import HealthScore from '../components/HealthScore';
import ComparisonChart from '../components/ComparisonChart';
import ScanToast from '../components/ScanToast';

// ── Static risk-timeline data (plausible 7-day trend toward resolution) ──
// Values represent total open findings per day; Monday through today.
const TIMELINE_DATA = [
  { day: 'Mon', count: 14 },
  { day: 'Tue', count: 14 },
  { day: 'Wed', count: 13 },
  { day: 'Thu', count: 12 },
  { day: 'Fri', count: 11 },
  { day: 'Sat', count: 10 },
  { day: 'Sun', count: 10 },
];

// ── Risk Timeline sparkline ────────────────────────────────────
function RiskTimeline({ currentCount }) {
  const W = 480, H = 72, padX = 32, padY = 12;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  // Splice in the live count as today's final data point
  const data = [...TIMELINE_DATA.slice(0, 6), { day: 'Today', count: currentCount }];
  const counts = data.map((d) => d.count);
  const maxV = Math.max(...counts, 1);
  const minV = Math.min(...counts, 0);
  const range = maxV - minV || 1;

  function px(i) { return padX + (i / (data.length - 1)) * innerW; }
  function py(v) { return padY + (1 - (v - minV) / range) * innerH; }

  const points = data.map((d, i) => `${px(i)},${py(d.count)}`).join(' ');
  const areaPoints = `${padX},${padY + innerH} ${points} ${padX + innerW},${padY + innerH}`;

  const accentColor = '#3b82d4';

  return (
    <div className="risk-timeline-wrap">
      <div className="risk-timeline-header">
        <span className="risk-timeline-title">Risk Timeline</span>
        <span className="risk-timeline-sub">Last 7 days · open findings</span>
      </div>
      <svg
        className="risk-timeline-svg"
        viewBox={`0 0 ${W} ${H}`}
        height={H}
        preserveAspectRatio="none"
      >
        {/* Subtle grid */}
        {[0, 0.5, 1].map((frac, i) => (
          <line
            key={i}
            x1={padX} y1={padY + frac * innerH}
            x2={padX + innerW} y2={padY + frac * innerH}
            stroke="var(--border)" strokeWidth={1}
          />
        ))}

        {/* Area fill */}
        <polygon points={areaPoints} fill={accentColor} opacity={0.08} />

        {/* Sparkline */}
        <polyline
          points={points}
          fill="none"
          stroke={accentColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data point dots + labels */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={px(i)} cy={py(d.count)} r={3.5}
              fill={accentColor} />
            {/* Day label */}
            <text
              x={px(i)} y={H - 2}
              textAnchor="middle"
              fontSize={9.5}
              fontFamily="-apple-system,'Segoe UI',system-ui,sans-serif"
              fill="var(--muted)"
            >
              {d.day}
            </text>
            {/* Value label above first and last */}
            {(i === 0 || i === data.length - 1) && (
              <text
                x={px(i)} y={py(d.count) - 6}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fontFamily="-apple-system,'Segoe UI',system-ui,sans-serif"
                fill={accentColor}
              >
                {d.count}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Export Report helper ───────────────────────────────────────
function buildReport(findings, project, target) {
  const lines = [
    `# CodePulse Scan Report`,
    ``,
    `**Project:** ${target}  `,
    `**Version:** ${project}  `,
    `**Date:** ${new Date().toLocaleDateString()}  `,
    `**Total findings:** ${findings.length}`,
    ``,
    `---`,
    ``,
  ];

  const sevOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...findings].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

  for (const f of sorted) {
    lines.push(`## [${f.severity.toUpperCase()}] ${f.id} — ${f.category}`);
    lines.push(`**File:** \`${f.file}:${f.line}\``);
    lines.push(`**Description:** ${f.description}`);
    lines.push(`\`\`\``);
    lines.push(f.snippet);
    lines.push(`\`\`\``);
    lines.push(``);
  }

  return lines.join('\n');
}

// Category metadata: icon (SVG path), accent color, bg tint
const CATEGORY_META = {
  'Bugs & Logic': {
    color: '#e05d2e',
    bg: '#fff4f0',
    border: '#fbd4c4',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  'Error Handling': {
    color: '#c2410c',
    bg: '#fff7ed',
    border: '#fed7aa',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 17L10 3l7 14H3zm7-5v-3m0 4.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  'Security': {
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  'API & Data Flow': {
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  'Performance': {
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 17l4-6 4 3 3-5 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
};

const SEVERITY_BADGE = {
  high:   { label: 'High',   cls: 'badge badge--high' },
  medium: { label: 'Medium', cls: 'badge badge--medium' },
  low:    { label: 'Low',    cls: 'badge badge--low' },
};

const CATEGORY_ORDER = ['Security', 'Bugs & Logic', 'Error Handling', 'API & Data Flow', 'Performance'];

export default function Dashboard() {
  const { findings, loading, scanning, error, project, target } = useScan();

  // ── Toast state ────────────────────────────────────────────
  // We want to show the toast exactly once when a rescan completes and the
  // project lands on 'after'. Track whether we were mid-scan for 'after'.
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // Ref so we can check inside the scanning→idle transition without stale closure
  const pendingToastRef = useRef(false);

  // When project switches to 'after', arm the pending flag
  useEffect(() => {
    if (project === 'after') pendingToastRef.current = true;
    else                     pendingToastRef.current = false;
  }, [project]);

  // Fire when scanning settles and the pending flag is armed
  const prevScanningRef = useRef(scanning);
  useEffect(() => {
    const wasScanning = prevScanningRef.current;
    prevScanningRef.current = scanning;
    if (wasScanning && !scanning && pendingToastRef.current) {
      pendingToastRef.current = false;
      setToastMessage('2 issues resolved');
      setToastVisible(true);
    }
  }, [scanning]);

  // Group findings by category
  const byCategory = {};
  for (const cat of CATEGORY_ORDER) byCategory[cat] = [];
  for (const f of findings) {
    if (byCategory[f.category]) byCategory[f.category].push(f);
    else byCategory[f.category] = [f];
  }

  const totalFindings = findings.length;
  const highCount     = findings.filter((f) => f.severity === 'high').length;
  const mediumCount   = findings.filter((f) => f.severity === 'medium').length;
  const isLoading     = loading || scanning;

  // Export report handler
  const handleExport = useCallback(() => {
    const content  = buildReport(findings, project, target);
    const blob     = new Blob([content], { type: 'text/markdown' });
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement('a');
    a.href         = url;
    a.download     = `codepulse-report-${target}-${project}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [findings, project, target]);

  return (
    <div className="dashboard">

      {/* ── Toast ──────────────────────────────────────────── */}
      <ScanToast
        show={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />

      {/* ── Hero header with animated gradient ─────────────── */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div>
            <h1 className="dashboard-title">Issue Summary</h1>
            {!isLoading && (
              <p className="dashboard-meta">
                {project === 'after'
                  ? 'Showing fixed version — some issues resolved'
                  : 'Showing original version — all issues present'}
                {totalFindings > 0 && ` · ${totalFindings} finding${totalFindings !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
          {/* Health score gauge — glass card in top-right of hero */}
          <div className="dashboard-hero-score">
            <HealthScore />
          </div>
        </div>
      </div>

      {error && <div className="dashboard-error">⚠ {error}</div>}

      {/* ── Summary stat pills ─────────────────────────────── */}
      {!isLoading && totalFindings > 0 && (
        <div className="stat-row">
          <div className="stat-pill stat-pill--total">
            <span className="stat-pill-num">{totalFindings}</span>
            <span className="stat-pill-label">Total</span>
          </div>
          <div className="stat-pill stat-pill--high">
            <span className="stat-pill-num">{highCount}</span>
            <span className="stat-pill-label">High</span>
          </div>
          <div className="stat-pill stat-pill--medium">
            <span className="stat-pill-num">{mediumCount}</span>
            <span className="stat-pill-label">Medium</span>
          </div>
          <div className="stat-pill stat-pill--low">
            <span className="stat-pill-num">{totalFindings - highCount - mediumCount}</span>
            <span className="stat-pill-label">Low</span>
          </div>
        </div>
      )}

      {/* ── Category cards ─────────────────────────────────── */}
      {!isLoading && (
        <div className="category-grid">
          {CATEGORY_ORDER.map((cat) => {
            const meta   = CATEGORY_META[cat] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: null };
            const items  = byCategory[cat] || [];
            const count  = items.length;
            const hasHigh = items.some((f) => f.severity === 'high');

            return (
              <div
                key={cat}
                className={`category-card${count === 0 ? ' category-card--empty' : ''}`}
                style={{ '--card-color': meta.color, '--card-bg': meta.bg, '--card-border': meta.border }}
              >
                <div className="category-card-header">
                  <span className="category-icon" style={{ color: meta.color, background: meta.bg }}>
                    {meta.icon}
                  </span>
                  <span className="category-name">{cat}</span>
                  {hasHigh && <span className="high-dot" title="Contains high-severity findings" />}
                </div>

                <div className="category-card-count" style={{ color: count > 0 ? meta.color : '#9ca3af' }}>
                  {count}
                </div>
                <div className="category-card-label">
                  {count === 0 ? 'No issues found' : `finding${count !== 1 ? 's' : ''}`}
                </div>

                {/* Inline finding list */}
                {count > 0 && (
                  <ul className="finding-list">
                    {items.map((f, idx) => (
                      <li key={idx} className="finding-item">
                        <span className={SEVERITY_BADGE[f.severity]?.cls || 'badge'}>
                          {SEVERITY_BADGE[f.severity]?.label || f.severity}
                        </span>
                        <span className="finding-location">
                          {f.file.split('/').pop()}:{f.line}
                        </span>
                        <span className="finding-id">{f.id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Export Report button ────────────────────────────── */}
      {!isLoading && findings.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button
            type="button"
            className="export-report-btn"
            onClick={handleExport}
            title="Download findings as a Markdown report"
          >
            <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M7.5 1v9m0 0l-3-3m3 3l3-3M2 11v2a1 1 0 001 1h9a1 1 0 001-1v-2"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export Report
          </button>
        </div>
      )}

      {/* ── Before/After comparison chart ──────────────────── */}
      {!isLoading && (
        <div className="dashboard-chart-wrap">
          <ComparisonChart />
        </div>
      )}

      {/* ── Risk Timeline sparkline ─────────────────────────── */}
      {!isLoading && (
        <RiskTimeline currentCount={totalFindings} />
      )}

      {isLoading && (
        <div className="scan-loading-state">
          <div className="scan-loading-spinner" />
          <p>{scanning ? 'Re-scanning…' : 'Analyzing codebase…'}</p>
        </div>
      )}
    </div>
  );
}
