import React from 'react';
import { useScan, SCAN_TARGETS } from '../context/ScanContext';

export default function TopBar({ onOpenPalette }) {
  const { project, target, findings, toggleProject, switchTarget, loading, scanning } = useScan();

  const isBefore  = project === 'before';
  const isBusy    = loading || scanning;
  const nextLabel = isBefore ? 'After' : 'Before';

  const totalCount = findings.length;
  const statusText = isBefore
    ? `${totalCount} issue${totalCount !== 1 ? 's' : ''}`
    : `${totalCount} issue${totalCount !== 1 ? 's' : ''} · some fixed`;

  return (
    <header className="topbar">
      {/* Left: project name dropdown */}
      <select
        className="topbar-project-select"
        value={target}
        onChange={(e) => switchTarget(e.target.value)}
        disabled={isBusy}
        aria-label="Select project to scan"
      >
        {SCAN_TARGETS.map(({ key, label }) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      {/* Right: palette trigger + Before/After toggle + Re-scan button */}
      <div className="topbar-actions">
        {/* Command palette trigger */}
        <button
          className="topbar-palette-btn"
          onClick={onOpenPalette}
          type="button"
          title="Open command palette (⌘K / Ctrl+K)"
        >
          <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Search findings
          <kbd className="topbar-kbd">⌘K</kbd>
        </button>

        {/* Segmented Before / After toggle */}
        <div className="project-toggle" aria-label="Switch project version">
          <button
            className={`project-toggle-btn${isBefore ? ' project-toggle-btn--active' : ''}`}
            onClick={isBefore ? undefined : toggleProject}
            disabled={isBusy}
            type="button"
            aria-pressed={isBefore}
          >
            Before
          </button>
          <button
            className={`project-toggle-btn${!isBefore ? ' project-toggle-btn--active' : ''}`}
            onClick={!isBefore ? undefined : toggleProject}
            disabled={isBusy}
            type="button"
            aria-pressed={!isBefore}
          >
            After
          </button>
        </div>

        {/* Status pill */}
        <span className={`topbar-status${!isBefore ? ' topbar-status--fixed' : ''}`}>
          {isBusy ? '…' : statusText}
        </span>

        {/* Re-scan / toggle button */}
        <button
          className={`topbar-rescan-btn${isBusy ? ' topbar-rescan-btn--scanning' : ''}`}
          onClick={toggleProject}
          disabled={isBusy}
          type="button"
          title={isBusy ? 'Scanning…' : `Switch to ${nextLabel} version`}
        >
          {isBusy ? (
            <>
              <span className="topbar-spinner" />
              Scanning…
            </>
          ) : (
            <>
              <span className="topbar-rescan-icon">⟳</span>
              Re-scan
            </>
          )}
        </button>
      </div>
    </header>
  );
}
