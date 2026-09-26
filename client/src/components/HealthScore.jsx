/**
 * HealthScore.jsx
 *
 * Radial donut gauge — 0–100 security health score.
 *
 * Scoring formula (gentler weights so Before/After produce visible spread):
 *   penalty = high×6 + medium×2 + low×1
 *   score   = max(5, 100 − penalty)
 *
 * Color bands:
 *   < 50  → red   (#dc2626)
 *   50–74 → amber (#d97706)
 *   ≥ 75  → green (#059669)
 *
 * The score number counts up/down with requestAnimationFrame when the
 * underlying value changes instead of snapping instantly.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useScan } from '../context/ScanContext';

// ── Score calculation ──────────────────────────────────────
export function calcScore(findings) {
  let penalty = 0;
  for (const f of findings) {
    if      (f.severity === 'high')   penalty += 6;
    else if (f.severity === 'medium') penalty += 2;
    else                               penalty += 1;
  }
  return Math.max(5, 100 - penalty);
}

function scoreColor(score) {
  if (score >= 75) return '#059669';
  if (score >= 50) return '#d97706';
  return '#dc2626';
}

function scoreLabel(score) {
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

// ── Donut arc math ─────────────────────────────────────────
const R        = 42;
const CX       = 60;
const CY       = 60;
const STROKE_W = 9;
const FULL_CIRC = 2 * Math.PI * R;

// ── Animated counter hook ──────────────────────────────────
// Smoothly interpolates `displayed` from its previous value to `target`
// using a fixed-duration easing (400 ms). Returns the current display value.
function useCountUp(target, duration = 500) {
  const [displayed, setDisplayed] = useState(target);
  const rafRef   = useRef(null);
  const startRef = useRef(null);
  const fromRef  = useRef(target);

  useEffect(() => {
    if (target === null) return;
    const from = fromRef.current ?? target;
    if (from === target) return;

    // Cancel any in-flight animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    startRef.current = null;

    function step(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed  = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(from + (target - from) * eased);
      setDisplayed(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    }

    fromRef.current = from;
    rafRef.current  = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  // Keep fromRef in sync when target is first set
  useEffect(() => {
    if (target !== null && fromRef.current === null) {
      fromRef.current = target;
      setDisplayed(target);
    }
  }, [target]);

  return displayed;
}

// ── Component ──────────────────────────────────────────────
export default function HealthScore() {
  const { findings, loading, scanning } = useScan();
  const arcRef    = useRef(null);
  const isLoading = loading || scanning;

  const score     = isLoading ? null : calcScore(findings);
  const displayed = useCountUp(score);

  // Use displayed value for color so it transitions smoothly with the count
  const color = displayed !== null ? scoreColor(displayed) : '#e5e7eb';
  const label = score     !== null ? scoreLabel(score)     : '';

  const arcLength = score !== null ? FULL_CIRC * (score / 100) : 0;
  const gapLength = FULL_CIRC - arcLength;

  // Animate the SVG arc whenever the real score changes
  useEffect(() => {
    if (!arcRef.current || score === null) return;
    arcRef.current.style.strokeDasharray = `${arcLength} ${gapLength}`;
    arcRef.current.style.stroke = scoreColor(score);
  }, [arcLength, gapLength, score]);

  return (
    <div className="hs-root">
      <div className="hs-gauge-wrap">
        <svg
          viewBox="0 0 120 120"
          width={120}
          height={120}
          aria-label={`Security health score: ${score ?? 'loading'}`}
        >
          {/* Track ring */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={STROKE_W}
          />

          {/* Score arc */}
          <circle
            ref={arcRef}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${gapLength}`}
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1), stroke 0.45s ease' }}
          />

          {/* Score number — driven by the animated counter */}
          {score !== null && (
            <text
              x={CX} y={CY - 6}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={22} fontWeight={800}
              fill={color}
              fontFamily="-apple-system, 'Segoe UI', system-ui, sans-serif"
              style={{ transition: 'fill 0.45s ease' }}
            >
              {displayed}
            </text>
          )}

          {/* "/100" sub-label */}
          {score !== null && (
            <text
              x={CX} y={CY + 14}
              textAnchor="middle"
              fontSize={10} fontWeight={600}
              fill="rgba(87,96,106,0.7)"
              fontFamily="-apple-system, 'Segoe UI', system-ui, sans-serif"
            >
              / 100
            </text>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={STROKE_W}
              strokeDasharray={`${FULL_CIRC * 0.25} ${FULL_CIRC * 0.75}`}
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ animation: 'spin 1s linear infinite' }}
            />
          )}
        </svg>
      </div>

      <div className="hs-meta">
        <span className="hs-title">Health Score</span>
        {score !== null && (
          <>
            <span className="hs-label" style={{ color: scoreColor(score) }}>
              {label}
            </span>
            <span className="hs-breakdown">
              {findings.filter((f) => f.severity === 'high').length}H ·{' '}
              {findings.filter((f) => f.severity === 'medium').length}M ·{' '}
              {findings.filter((f) => f.severity === 'low').length}L
            </span>
          </>
        )}
        {isLoading && <span className="hs-loading-text">Calculating…</span>}
      </div>
    </div>
  );
}
