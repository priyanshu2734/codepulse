/**
 * ComparisonChart.jsx
 *
 * Pure-SVG grouped bar chart comparing Before vs After finding counts
 * per category. Fetches both datasets independently so it doesn't
 * depend on the currently-active project in ScanContext.
 *
 * No external charting library — all layout math is done inline.
 */

import React, { useEffect, useState } from 'react';

const CATEGORY_ORDER = [
  'Security', 'Bugs & Logic', 'Error Handling', 'API & Data Flow', 'Performance',
];

// Short labels to keep the x-axis readable
const CAT_SHORT = {
  'Security':        'Security',
  'Bugs & Logic':    'Bugs',
  'Error Handling':  'Errors',
  'API & Data Flow': 'API',
  'Performance':     'Perf',
};

const BEFORE_COLOR = '#3b82d4';   // accent blue
const AFTER_COLOR  = '#10b981';   // emerald green

// SVG layout constants
const BAR_GROUP_W = 72;   // width allocated per category group
const BAR_W       = 22;   // width of a single bar
const BAR_GAP     = 6;    // gap between the two bars in a group
const GROUP_GAP   = 20;   // gap between category groups
const CHART_H     = 120;  // height of the drawable bar area
const PAD_L       = 36;   // left padding (for y-axis labels)
const PAD_R       = 16;
const PAD_T       = 16;   // top padding (for value labels)
const PAD_B       = 48;   // bottom padding (for category labels)

export default function ComparisonChart() {
  const [beforeCounts, setBeforeCounts] = useState(null);
  const [afterCounts,  setAfterCounts]  = useState(null);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [bRes, aRes] = await Promise.all([
          fetch('/api/scan?project=before'),
          fetch('/api/scan?project=after'),
        ]);
        if (!bRes.ok || !aRes.ok) throw new Error('Scan fetch failed');
        const [bData, aData] = await Promise.all([bRes.json(), aRes.json()]);
        if (cancelled) return;

        // Tally counts per category
        function tally(findings) {
          const counts = {};
          for (const cat of CATEGORY_ORDER) counts[cat] = 0;
          for (const f of findings) {
            if (counts[f.category] !== undefined) counts[f.category]++;
            else counts[f.category] = 1;
          }
          return counts;
        }

        setBeforeCounts(tally(bData.findings || []));
        setAfterCounts(tally(aData.findings  || []));
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (error) return null; // silent — chart is additive polish
  if (!beforeCounts || !afterCounts) {
    return (
      <div className="cc-loading">
        <div className="cc-loading-spinner" />
        <span>Loading comparison…</span>
      </div>
    );
  }

  // Compute max value for y-scale
  const allVals = CATEGORY_ORDER.flatMap((c) => [beforeCounts[c], afterCounts[c]]);
  const maxVal  = Math.max(...allVals, 1);

  // Round max up to a nice ceiling
  const yMax = Math.ceil(maxVal / 2) * 2 || 2;

  // SVG total dimensions
  const svgW = PAD_L + CATEGORY_ORDER.length * BAR_GROUP_W + (CATEGORY_ORDER.length - 1) * GROUP_GAP + PAD_R;
  const svgH = PAD_T + CHART_H + PAD_B;

  // Y-axis tick values (0, yMax/2, yMax)
  const yTicks = [0, Math.round(yMax / 2), yMax];

  function barHeight(val) {
    return (val / yMax) * CHART_H;
  }

  function groupX(i) {
    return PAD_L + i * (BAR_GROUP_W + GROUP_GAP);
  }

  return (
    <div className="cc-root">
      <div className="cc-header">
        <span className="cc-title">Before vs After — Findings by Category</span>
        <div className="cc-legend">
          <span className="cc-legend-item">
            <span className="cc-legend-swatch" style={{ background: BEFORE_COLOR }} />
            Before
          </span>
          <span className="cc-legend-item">
            <span className="cc-legend-swatch" style={{ background: AFTER_COLOR }} />
            After
          </span>
        </div>
      </div>

      <div className="cc-svg-wrap">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          height={svgH}
          style={{ display: 'block', overflow: 'visible' }}
          aria-label="Before vs After findings comparison chart"
        >
          {/* ── Y-axis grid lines + labels ── */}
          {yTicks.map((tick) => {
            const y = PAD_T + CHART_H - barHeight(tick);
            return (
              <g key={tick}>
                <line
                  x1={PAD_L - 6} y1={y}
                  x2={svgW - PAD_R} y2={y}
                  stroke="rgba(0,0,0,0.07)" strokeWidth={1}
                  strokeDasharray={tick === 0 ? '0' : '4 3'}
                />
                <text
                  x={PAD_L - 10} y={y}
                  textAnchor="end" dominantBaseline="middle"
                  fontSize={10} fill="var(--muted)"
                  fontFamily="-apple-system, 'Segoe UI', system-ui, sans-serif"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* ── Bars ── */}
          {CATEGORY_ORDER.map((cat, i) => {
            const gx   = groupX(i);
            const bVal = beforeCounts[cat];
            const aVal = afterCounts[cat];
            const bH   = barHeight(bVal);
            const aH   = barHeight(aVal);
            const baseY = PAD_T + CHART_H;

            const beforeX = gx + (BAR_GROUP_W - BAR_W * 2 - BAR_GAP) / 2;
            const afterX  = beforeX + BAR_W + BAR_GAP;

            return (
              <g key={cat}>
                {/* Before bar */}
                <rect
                  x={beforeX} y={baseY - bH}
                  width={BAR_W} height={Math.max(bH, 1)}
                  rx={3} fill={BEFORE_COLOR} opacity={0.85}
                />
                {bVal > 0 && (
                  <text
                    x={beforeX + BAR_W / 2} y={baseY - bH - 5}
                    textAnchor="middle" fontSize={9} fontWeight={700}
                    fill={BEFORE_COLOR}
                    fontFamily="-apple-system, 'Segoe UI', system-ui, sans-serif"
                  >
                    {bVal}
                  </text>
                )}

                {/* After bar */}
                <rect
                  x={afterX} y={baseY - aH}
                  width={BAR_W} height={Math.max(aH, 1)}
                  rx={3} fill={AFTER_COLOR} opacity={0.85}
                />
                {aVal > 0 && (
                  <text
                    x={afterX + BAR_W / 2} y={baseY - aH - 5}
                    textAnchor="middle" fontSize={9} fontWeight={700}
                    fill={AFTER_COLOR}
                    fontFamily="-apple-system, 'Segoe UI', system-ui, sans-serif"
                  >
                    {aVal}
                  </text>
                )}

                {/* Category label */}
                <text
                  x={gx + BAR_GROUP_W / 2} y={baseY + 14}
                  textAnchor="middle" fontSize={11} fontWeight={600}
                  fill="var(--muted)"
                  fontFamily="-apple-system, 'Segoe UI', system-ui, sans-serif"
                >
                  {CAT_SHORT[cat] || cat}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
