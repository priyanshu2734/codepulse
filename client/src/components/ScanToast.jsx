/**
 * ScanToast.jsx
 *
 * Subtle success toast that appears briefly when the user switches from
 * "before" to "after" (i.e. issues have been resolved).
 *
 * Usage: mount once in Dashboard, pass `show` (bool) and `message` (string).
 * It auto-dismisses after 3 s; parent controls the `show` flag via the
 * `onHide` callback so it can be retriggered on the next toggle.
 *
 * No external library — pure CSS animation (slide-in / fade-out).
 */

import React, { useEffect } from 'react';

export default function ScanToast({ show, message, onHide }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onHide, 3000);
    return () => clearTimeout(t);
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="scan-toast" role="status" aria-live="polite">
      <span className="scan-toast-icon">✓</span>
      {message}
    </div>
  );
}
