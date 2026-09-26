import React, { useState, useEffect, useRef } from 'react';
import { useScan } from '../context/ScanContext';

// ── Category colour map ───────────────────────────────────────
const CATEGORY_COLOR = {
  'Security':        { accent: '#dc2626', glow: 'rgba(220,38,38,0.45)'  },
  'Bugs & Logic':    { accent: '#e05d2e', glow: 'rgba(224,93,46,0.45)'  },
  'Error Handling':  { accent: '#c2410c', glow: 'rgba(194,65,12,0.45)'  },
  'API & Data Flow': { accent: '#7c3aed', glow: 'rgba(124,58,237,0.45)' },
  'Performance':     { accent: '#0369a1', glow: 'rgba(3,105,161,0.45)'  },
};

const SEVERITY_META = {
  high:   { label: 'High',   cls: 'gv-badge gv-badge--high'   },
  medium: { label: 'Medium', cls: 'gv-badge gv-badge--medium' },
  low:    { label: 'Low',    cls: 'gv-badge gv-badge--low'    },
};

// Severity heat-ring colors
const SEV_COLOR = { high: '#dc2626', medium: '#d97706', low: '#059669' };

const CATEGORY_ORDER = [
  'Security', 'Bugs & Logic', 'Error Handling', 'API & Data Flow', 'Performance',
];

// Pipeline layout constants
const NODE_W   = 108;
const NODE_H   = 60;
const NODE_GAP = 56;
const SVG_PAD_X = 28;
const SVG_PAD_Y = 40;   // extra top pad for heat rings

function findingKey(f) { return `${f.id}:${f.file}:${f.line}`; }

// ── Scan pulse hook ───────────────────────────────────────────
function useScanPulse(scanning, nodeCount) {
  const [pulseIdx, setPulseIdx] = useState(-1);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!scanning || nodeCount === 0) {
      setPulseIdx(-1);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setPulseIdx(0);
    timerRef.current = setInterval(() => {
      setPulseIdx((prev) => {
        const next = prev + 1;
        return next >= nodeCount ? 0 : next;
      });
    }, 320);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [scanning, nodeCount]);

  return pulseIdx;
}

// ── Chart type tabs ────────────────────────────────────────────
const CHART_TABS = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'pie',      label: 'Pie Chart' },
  { key: 'bar',      label: 'Bar Chart' },
  { key: 'treemap',  label: 'Treemap'   },
];

// ── Main component ────────────────────────────────────────────
export default function GraphView() {
  const { findings, graph, loading, scanning, error, project } = useScan();
  const [selected,    setSelected]    = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [chartType,   setChartType]   = useState('pipeline');

  // Reset on project switch
  useEffect(() => { setSelected(null); }, [project]);

  const isLoading = loading || scanning;
  const nodeCount = graph?.nodes?.length ?? 0;
  const pulseIdx  = useScanPulse(scanning, nodeCount);

  // Auto-select first finding once data is ready
  useEffect(() => {
    if (!isLoading && !selected && findings.length > 0) setSelected(findings[0]);
  }, [isLoading, findings, selected]);

  // Flat ordered list for prev/next navigation
  const orderedFindings = CATEGORY_ORDER.flatMap((cat) =>
    findings.filter((f) => f.category === cat)
  );
  const selectedIdx = selected
    ? orderedFindings.findIndex((f) => findingKey(f) === findingKey(selected))
    : -1;

  function goNext() {
    if (orderedFindings.length === 0) return;
    const nextIdx = (selectedIdx + 1) % orderedFindings.length;
    setSelected(orderedFindings[nextIdx]);
  }
  function goPrev() {
    if (orderedFindings.length === 0) return;
    const prevIdx = (selectedIdx - 1 + orderedFindings.length) % orderedFindings.length;
    setSelected(orderedFindings[prevIdx]);
  }

  // Derive active nodes/edges
  const activeNodes = new Set();
  const activeEdges = new Set();
  if (selected && graph) {
    const key = findingKey(selected);
    (graph.findingNodes[key] || []).forEach((n) => activeNodes.add(n));
    if (graph.edges) {
      for (const edge of graph.edges) {
        if (activeNodes.has(edge.from) && activeNodes.has(edge.to))
          activeEdges.add(`${edge.from}→${edge.to}`);
      }
    }
  }

  // Build nodeFindings map (all findings per node)
  const nodeFindings = {};
  if (graph && findings.length > 0) {
    for (const f of findings) {
      const key = findingKey(f);
      for (const nid of (graph.findingNodes?.[key] || [])) {
        if (!nodeFindings[nid]) nodeFindings[nid] = [];
        nodeFindings[nid].push(f);
      }
    }
  }

  // Build firstFindingPerNode map for node-click navigation
  const firstFindingPerNode = {};
  if (graph) {
    for (const nd of (graph.nodes || [])) {
      const hits = nodeFindings[nd.id];
      if (hits && hits.length > 0) firstFindingPerNode[nd.id] = hits[0];
    }
  }

  const catColor = selected
    ? (CATEGORY_COLOR[selected.category] || { accent: '#3b82d4', glow: 'rgba(59,130,212,0.45)' })
    : null;

  // Group for list panel
  const grouped = {};
  for (const cat of CATEGORY_ORDER) grouped[cat] = [];
  for (const f of findings) {
    if (grouped[f.category]) grouped[f.category].push(f);
    else grouped[f.category] = [f];
  }

  return (
    <div className="gv-root">
      {/* ── Pipeline graph area ──────────────────────────── */}
      <div className="gv-graph-area">
        <div className="gv-graph-header">
          <span className="gv-graph-title">
            {CHART_TABS.find((t) => t.key === chartType)?.label || 'Application Flow'}
          </span>
          {/* Chart type tabs */}
          <div className="gv-chart-tabs">
            {CHART_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`gv-chart-tab${chartType === tab.key ? ' gv-chart-tab--active' : ''}`}
                onClick={() => setChartType(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {selected && catColor && chartType === 'pipeline' && (
            <span className="gv-active-label" style={{ color: catColor.accent }}>
              ● {selected.id} — {selected.category}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="gv-graph-loading">
            <div className="gv-spinner" />
            <span>{scanning ? 'Re-scanning…' : 'Loading scan…'}</span>
          </div>
        )}

        {error && <div className="gv-graph-error">⚠ {error}</div>}

        {/* Pipeline view */}
        {chartType === 'pipeline' && (
          <>
            {/* Pulse during scan */}
            {scanning && graph && (
              <PipelineGraph
                nodes={graph.nodes}
                edges={graph.edges}
                activeNodes={activeNodes}
                activeEdges={activeEdges}
                nodeFindings={nodeFindings}
                firstFindingPerNode={firstFindingPerNode}
                catColor={catColor}
                hoveredNode={hoveredNode}
                setHoveredNode={setHoveredNode}
                onNodeClick={() => {}}
                pulseIdx={pulseIdx}
              />
            )}
            {!isLoading && graph && (
              <PipelineGraph
                nodes={graph.nodes}
                edges={graph.edges}
                activeNodes={activeNodes}
                activeEdges={activeEdges}
                nodeFindings={nodeFindings}
                firstFindingPerNode={firstFindingPerNode}
                catColor={catColor}
                hoveredNode={hoveredNode}
                setHoveredNode={setHoveredNode}
                onNodeClick={(nid) => {
                  if (firstFindingPerNode[nid]) setSelected(firstFindingPerNode[nid]);
                }}
                pulseIdx={-1}
              />
            )}
          </>
        )}

        {/* Pie chart: findings by category */}
        {chartType === 'pie' && !isLoading && (
          <PieByCategoryChart findings={findings} />
        )}

        {/* Bar chart: findings by severity */}
        {chartType === 'bar' && !isLoading && (
          <BySeverityBarChart findings={findings} />
        )}

        {/* Treemap: findings by file */}
        {chartType === 'treemap' && !isLoading && (
          <ByFileTreemap findings={findings} />
        )}
      </div>

      {/* ── System Architecture diagram ──────────────────── */}

      {/* ── Bottom: list + detail ────────────────────────── */}
      <div className="gv-bottom">
        {/* Finding list */}
        <div className="gv-finding-list">
          <div className="gv-list-header">
            <span className="gv-list-title">Findings</span>
            {findings.length > 0 && (
              <span className="gv-list-count">{findings.length}</span>
            )}
          </div>

          {!isLoading && findings.length === 0 && (
            <div className="gv-list-empty">No findings. Run a scan first.</div>
          )}

          <div className="gv-list-scroll">
            {!isLoading && CATEGORY_ORDER.map((cat) => {
              const items = grouped[cat];
              if (!items || items.length === 0) return null;
              const col = CATEGORY_COLOR[cat] || { accent: '#6b7280' };
              return (
                <div key={cat} className="gv-group">
                  <div className="gv-group-label" style={{ '--cat': col.accent }}>
                    <span className="gv-group-dot" />
                    {cat}
                  </div>
                  {items.map((f, idx) => {
                    const isActive = selected && findingKey(selected) === findingKey(f);
                    const sev = SEVERITY_META[f.severity] || SEVERITY_META.low;
                    return (
                      <button
                        key={idx}
                        className={`gv-finding-btn${isActive ? ' gv-finding-btn--active' : ''}`}
                        style={{ '--cat': col.accent }}
                        onClick={() => setSelected(f)}
                        type="button"
                      >
                        <span className={sev.cls}>{sev.label}</span>
                        <span className="gv-finding-btn-id">{f.id}</span>
                        <span className="gv-finding-btn-loc">
                          {f.file.split('/').pop()}:{f.line}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail strip */}
        <div className="gv-detail-strip">
          {!selected ? (
            <div className="gv-detail-strip-empty">
              Select a finding to see which nodes it affects
            </div>
          ) : (
            <FindingDetail
              finding={selected}
              activeNodes={activeNodes}
              graph={graph}
              catColor={catColor}
              selectedIdx={selectedIdx}
              totalFindings={orderedFindings.length}
              onPrev={goPrev}
              onNext={goNext}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pipeline SVG graph ────────────────────────────────────────
function PipelineGraph({
  nodes, edges, activeNodes, activeEdges,
  nodeFindings, firstFindingPerNode,
  catColor, hoveredNode, setHoveredNode, onNodeClick,
  pulseIdx = -1,
}) {
  const svgRef = useRef(null);
  if (!nodes || nodes.length === 0) return null;

  const n    = nodes.length;
  const svgW = SVG_PAD_X * 2 + n * NODE_W + (n - 1) * NODE_GAP;
  const svgH = SVG_PAD_Y * 2 + NODE_H;

  function nodeX(i) { return SVG_PAD_X + i * (NODE_W + NODE_GAP) + NODE_W / 2; }
  const nodeY = SVG_PAD_Y + NODE_H / 2;

  const nodeIdx = {};
  nodes.forEach((nd, i) => { nodeIdx[nd.id] = i; });

  const accent = catColor?.accent || '#3b82d4';

  return (
    <div className="gv-svg-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        height={svgH}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <filter id="glow-active" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="shadow-idle" x="-10%" y="-10%" width="120%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.4)" />
          </filter>
          <marker id="arrow-dim" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.12)" />
          </marker>
          <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={accent} />
          </marker>
        </defs>

        {/* Edges */}
        {edges && edges.map((edge) => {
          const fromI = nodeIdx[edge.from];
          const toI   = nodeIdx[edge.to];
          if (fromI === undefined || toI === undefined) return null;
          const edgeKey  = `${edge.from}→${edge.to}`;
          const isActive = activeEdges.has(edgeKey);
          const x1 = nodeX(fromI) + NODE_W / 2;
          const x2 = nodeX(toI)   - NODE_W / 2;
          return (
            <line
              key={edgeKey}
              x1={x1} y1={nodeY} x2={x2 - 4} y2={nodeY}
              stroke={isActive ? accent : 'rgba(255,255,255,0.1)'}
              strokeWidth={isActive ? 2.5 : 1.5}
              markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow-dim)'}
              style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((nd, i) => {
          const isActive  = activeNodes.has(nd.id);
          const isHovered = hoveredNode === nd.id;
          const cx = nodeX(i);
          const rx = cx - NODE_W / 2;
          const ry = SVG_PAD_Y;
          const hits       = nodeFindings[nd.id] || [];
          const hasFinding = hits.length > 0;
          const isClickable = !!firstFindingPerNode[nd.id];
          const isPulsing   = pulseIdx === i;

          const fill        = isActive  ? `rgba(${hexToRgb(accent)},0.15)`
                            : isPulsing ? 'rgba(59,130,212,0.22)'
                            : '#1e2435';
          const stroke      = isActive  ? accent
                            : isPulsing ? '#93c5fd'
                            : isHovered ? 'rgba(255,255,255,0.25)'
                            : '#2d3452';
          const strokeWidth = isActive || isPulsing ? 2 : 1.5;
          const labelColor  = isActive || isPulsing ? '#ffffff' : 'rgba(255,255,255,0.5)';
          const filterVal   = isActive || isPulsing ? 'url(#glow-active)' : 'url(#shadow-idle)';

          // Severity heat ring: stacked arcs, one per severity present
          const highCount   = hits.filter((f) => f.severity === 'high').length;
          const mediumCount = hits.filter((f) => f.severity === 'medium').length;
          const lowCount    = hits.filter((f) => f.severity === 'low').length;
          const totalHits   = hits.length;

          // Build heat ring segments (proportional arcs around the node)
          const ringR       = (Math.max(NODE_W, NODE_H) / 2) + 8;
          const ringCirc    = 2 * Math.PI * ringR;
          const ringSegments = [];
          if (hasFinding && totalHits > 0) {
            let offset = 0;
            [
              { count: highCount,   color: SEV_COLOR.high   },
              { count: mediumCount, color: SEV_COLOR.medium },
              { count: lowCount,    color: SEV_COLOR.low    },
            ].forEach(({ count, color }) => {
              if (count === 0) return;
              const frac    = count / totalHits;
              const dashLen = ringCirc * frac - 2; // 2px gap between segments
              ringSegments.push({
                color,
                dashLen: Math.max(dashLen, 0),
                dashOffset: -(offset * ringCirc),
              });
              offset += frac;
            });
          }

          const labelLines = nd.label.split('\n');

          return (
            <g
              key={nd.id}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
              onClick={() => isClickable && onNodeClick(nd.id)}
              onMouseEnter={() => setHoveredNode(nd.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Severity heat ring (behind the node box) */}
              {ringSegments.map((seg, si) => (
                <circle
                  key={si}
                  cx={cx} cy={ry + NODE_H / 2}
                  r={ringR}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={3}
                  strokeDasharray={`${seg.dashLen} ${ringCirc}`}
                  strokeDashoffset={seg.dashOffset - ringCirc * 0.25}
                  opacity={isActive ? 0.9 : 0.45}
                  style={{
                    transition: 'opacity 0.3s',
                    pointerEvents: 'none',
                    transform: `rotate(-90deg)`,
                    transformOrigin: `${cx}px ${ry + NODE_H / 2}px`,
                  }}
                />
              ))}

              {/* Node box */}
              <rect
                x={rx} y={ry}
                width={NODE_W} height={NODE_H}
                rx={10} ry={10}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                filter={filterVal}
                style={{ transition: 'fill 0.25s, stroke 0.25s, stroke-width 0.25s' }}
              />

              {/* Pulse ripple ring */}
              {isPulsing && (
                <rect
                  x={rx - 4} y={ry - 4}
                  width={NODE_W + 8} height={NODE_H + 8}
                  rx={13} ry={13}
                  fill="none" stroke="#93c5fd" strokeWidth={2} opacity={0}
                  style={{ animation: 'pulse-ring 0.64s ease-out forwards', pointerEvents: 'none' }}
                />
              )}

              {/* Active glow overlay */}
              {isActive && (
                <rect
                  x={rx} y={ry}
                  width={NODE_W} height={NODE_H}
                  rx={10} ry={10}
                  fill="none" stroke={accent} strokeWidth={6} opacity={0.18}
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Hover click hint */}
              {isHovered && isClickable && !isActive && (
                <rect
                  x={rx} y={ry}
                  width={NODE_W} height={NODE_H}
                  rx={10} ry={10}
                  fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Label */}
              {labelLines.map((line, li) => (
                <text
                  key={li}
                  x={cx}
                  y={nodeY - (labelLines.length - 1) * 8 + li * 16}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={12}
                  fontWeight={isActive ? 700 : 500}
                  fontFamily="-apple-system, 'Segoe UI', system-ui, sans-serif"
                  fill={isActive ? '#ffffff' : labelColor}
                  style={{ transition: 'fill 0.3s', userSelect: 'none' }}
                >
                  {line}
                </text>
              ))}

              {/* Finding count badge */}
              {hasFinding && (
                <g>
                  <circle cx={rx + NODE_W - 2} cy={ry + 2} r={9}
                    fill={isActive ? accent : '#2d3452'} />
                  <text
                    x={rx + NODE_W - 2} y={ry + 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={9} fontWeight={700}
                    fill={isActive ? '#fff' : 'rgba(255,255,255,0.45)'}
                    style={{ userSelect: 'none' }}
                  >
                    {hits.length}
                  </text>
                </g>
              )}

              {/* Hover tooltip */}
              {isHovered && hasFinding && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={cx - 80} y={ry - 36}
                    width={160} height={26}
                    rx={6} fill="#0f1117"
                    stroke="rgba(255,255,255,0.12)" strokeWidth={1}
                  />
                  <text
                    x={cx} y={ry - 23}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={11} fill="rgba(255,255,255,0.75)"
                    fontFamily="-apple-system, 'Segoe UI', system-ui, sans-serif"
                    style={{ userSelect: 'none' }}
                  >
                    {hits.length} finding{hits.length !== 1 ? 's' : ''} — click to select
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="gv-legend">
        <span className="gv-legend-item gv-legend-item--active">
          <span className="gv-legend-dot gv-legend-dot--active" />
          Affected by selected finding
        </span>
        <span className="gv-legend-item">
          <span className="gv-legend-dot" />
          Not in affected path
        </span>
        <span className="gv-legend-item">
          <span className="gv-legend-badge">3</span>
          Findings touching node
        </span>
        <span className="gv-legend-item">
          <span className="gv-legend-ring-sample" />
          Severity heat ring
        </span>
      </div>
    </div>
  );
}

// ── Finding detail strip ──────────────────────────────────────
function FindingDetail({ finding, activeNodes, graph, catColor, selectedIdx, totalFindings, onPrev, onNext }) {
  const accent    = catColor?.accent || '#3b82d4';
  const key       = findingKey(finding);
  const touched   = graph?.findingNodes?.[key] || [];
  const nodeLabels = (graph?.nodes || [])
    .filter((n) => touched.includes(n.id))
    .map((n) => n.label.replace('\n', ' '));

  return (
    <div className="gv-detail">
      {/* Prev / Next navigation */}
      <div className="gv-nav-row">
        <button
          type="button"
          className="gv-nav-btn"
          onClick={onPrev}
          title="Previous finding"
          aria-label="Previous finding"
        >
          ← Prev
        </button>
        <span className="gv-nav-pos">
          {selectedIdx + 1} / {totalFindings}
        </span>
        <button
          type="button"
          className="gv-nav-btn"
          onClick={onNext}
          title="Next finding"
          aria-label="Next finding"
        >
          Next →
        </button>
      </div>

      <div className="gv-detail-top">
        <span className={`gv-badge ${finding.severity === 'high' ? 'gv-badge--high' : finding.severity === 'medium' ? 'gv-badge--medium' : 'gv-badge--low'}`}>
          {finding.severity}
        </span>
        <code className="gv-detail-id">{finding.id}</code>
        <span className="gv-detail-category" style={{ color: accent }}>{finding.category}</span>
      </div>

      <p className="gv-detail-desc">{finding.description}</p>

      <div className="gv-detail-loc">
        <span className="gv-detail-loc-key">Location</span>
        <code className="gv-detail-loc-val">{finding.file}:{finding.line}</code>
      </div>

      {nodeLabels.length > 0 && (
        <div className="gv-detail-path">
          <span className="gv-detail-path-label">Affected path</span>
          <div className="gv-detail-path-nodes">
            {nodeLabels.map((label, i) => (
              <React.Fragment key={i}>
                <span className="gv-detail-path-node" style={{ borderColor: accent, color: '#fff' }}>
                  {label}
                </span>
                {i < nodeLabels.length - 1 && (
                  <span className="gv-detail-path-arrow" style={{ color: accent }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="gv-detail-snippet-wrap">
        <div className="gv-detail-snippet-chrome">
          <span>{finding.file.split('/').pop()}</span>
          <span>line {finding.line}</span>
        </div>
        <pre className="gv-detail-snippet"><code>{finding.snippet}</code></pre>
      </div>
    </div>
  );
}

// ── Pie chart: findings by category ──────────────────────────
function PieByCategoryChart({ findings }) {
  if (!findings.length) return <div className="gv-alt-chart"><p className="gv-alt-chart-title">No findings</p></div>;

  const totals = {};
  for (const cat of CATEGORY_ORDER) totals[cat] = 0;
  for (const f of findings) { if (totals[f.category] !== undefined) totals[f.category]++; }

  const total = findings.length;
  const colors = {
    'Security':        '#dc2626',
    'Bugs & Logic':    '#e05d2e',
    'Error Handling':  '#c2410c',
    'API & Data Flow': '#7c3aed',
    'Performance':     '#0369a1',
  };

  const cx = 100, cy = 100, r = 80;
  let angle = -Math.PI / 2; // start at top

  const slices = CATEGORY_ORDER
    .filter((cat) => totals[cat] > 0)
    .map((cat) => {
      const frac   = totals[cat] / total;
      const sweep  = frac * 2 * Math.PI;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      angle   += sweep;
      const x2 = cx + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);
      const large = sweep > Math.PI ? 1 : 0;
      // Label position at midpoint of arc
      const midAngle = angle - sweep / 2;
      const lx = cx + (r + 18) * Math.cos(midAngle);
      const ly = cy + (r + 18) * Math.sin(midAngle);
      return { cat, frac, x1, y1, x2, y2, large, lx, ly, color: colors[cat] || '#6b7280' };
    });

  return (
    <div className="gv-alt-chart">
      <p className="gv-alt-chart-title">Findings by Category</p>
      <svg viewBox="0 0 280 200" height={200} style={{ maxWidth: 320 }}>
        {slices.map((s, i) => (
          <g key={i}>
            <path
              d={`M${cx},${cy} L${s.x1},${s.y1} A${r},${r} 0 ${s.large},1 ${s.x2},${s.y2} Z`}
              fill={s.color}
              opacity={0.85}
              stroke="#0f1117"
              strokeWidth={1.5}
            />
          </g>
        ))}
        {/* Legend */}
        {CATEGORY_ORDER.filter((c) => totals[c] > 0).map((cat, i) => (
          <g key={cat} transform={`translate(210, ${18 + i * 22})`}>
            <rect width={10} height={10} rx={2} fill={colors[cat] || '#6b7280'} opacity={0.85} />
            <text x={14} y={9} fontSize={10} fill="rgba(255,255,255,0.6)"
              fontFamily="-apple-system,'Segoe UI',system-ui,sans-serif">
              {cat.split(' & ')[0]} ({totals[cat]})
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Bar chart: findings by severity ──────────────────────────
function BySeverityBarChart({ findings }) {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const f of findings) { if (counts[f.severity] !== undefined) counts[f.severity]++; }

  const bars = [
    { label: 'High',   key: 'high',   color: '#dc2626' },
    { label: 'Medium', key: 'medium', color: '#d97706' },
    { label: 'Low',    key: 'low',    color: '#059669' },
  ];
  const maxVal = Math.max(...bars.map((b) => counts[b.key]), 1);

  const chartH = 100, chartW = 300, barW = 54, barGap = 30;
  const padL = 28, padB = 24;

  return (
    <div className="gv-alt-chart">
      <p className="gv-alt-chart-title">Findings by Severity</p>
      <svg viewBox={`0 0 ${chartW} ${chartH + padB + 10}`} height={chartH + padB + 10}
        style={{ maxWidth: 360 }}>
        {/* Y-axis gridlines */}
        {[0, 0.5, 1].map((frac, i) => {
          const y = 8 + chartH * (1 - frac);
          return (
            <line key={i} x1={padL} y1={y} x2={chartW - 10} y2={y}
              stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          );
        })}
        {bars.map((bar, i) => {
          const x   = padL + i * (barW + barGap);
          const val = counts[bar.key];
          const bH  = val === 0 ? 2 : (val / maxVal) * chartH;
          const y   = 8 + (chartH - bH);
          return (
            <g key={bar.key}>
              <rect x={x} y={y} width={barW} height={bH}
                fill={bar.color} opacity={0.8} rx={4} />
              {/* Value label */}
              <text x={x + barW / 2} y={y - 5}
                textAnchor="middle" fontSize={11} fontWeight={700}
                fill="rgba(255,255,255,0.7)"
                fontFamily="-apple-system,'Segoe UI',system-ui,sans-serif">
                {val}
              </text>
              {/* X-axis label */}
              <text x={x + barW / 2} y={8 + chartH + 16}
                textAnchor="middle" fontSize={11}
                fill="rgba(255,255,255,0.4)"
                fontFamily="-apple-system,'Segoe UI',system-ui,sans-serif">
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Treemap: findings by file ─────────────────────────────────
function ByFileTreemap({ findings }) {
  if (!findings.length) return <div className="gv-alt-chart"><p className="gv-alt-chart-title">No findings</p></div>;

  // Count findings per file
  const fileCounts = {};
  for (const f of findings) {
    fileCounts[f.file] = (fileCounts[f.file] || 0) + 1;
  }
  const entries = Object.entries(fileCounts).sort((a, b) => b[1] - a[1]);
  const total   = entries.reduce((s, [, c]) => s + c, 0);

  const W = 440, H = 140;
  // Simple horizontal treemap
  let x = 0;
  const rects = entries.map(([file, count]) => {
    const w = Math.round((count / total) * W);
    const rect = { file, count, x, w };
    x += w;
    return rect;
  });

  const palette = ['#3b82d4','#7c3aed','#dc2626','#d97706','#059669','#c2410c','#0369a1'];

  return (
    <div className="gv-alt-chart">
      <p className="gv-alt-chart-title">Findings by File</p>
      <svg viewBox={`0 0 ${W} ${H + 4}`} height={H + 4} width="100%" style={{ maxWidth: 500 }}>
        {rects.map(({ file, count, x: rx, w }, i) => {
          const label = file.split('/').pop();
          const color = palette[i % palette.length];
          const textFits = w > 36;
          return (
            <g key={file}>
              <rect x={rx} y={0} width={w - 1} height={H}
                fill={color} opacity={0.72} rx={3} />
              {textFits && (
                <>
                  <text x={rx + w / 2} y={H / 2 - 6}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.min(11, w / label.length * 1.4)}
                    fontWeight={600}
                    fill="rgba(255,255,255,0.9)"
                    fontFamily="-apple-system,'Segoe UI',system-ui,sans-serif"
                    style={{ userSelect: 'none' }}>
                    {label}
                  </text>
                  <text x={rx + w / 2} y={H / 2 + 10}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={12} fontWeight={800}
                    fill="rgba(255,255,255,0.95)"
                    fontFamily="-apple-system,'Segoe UI',system-ui,sans-serif"
                    style={{ userSelect: 'none' }}>
                    {count}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── System Architecture diagram ──────────────────────────────
// Static illustrative SVG showing the CodePulse pipeline:
//   React Client → Express Server → [Analyzer | AI Layer | Graph Builder]
//                                 ← JSON Response ←
// Based on blueprint.md §7 Technical Architecture.

// ── Utility ───────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
