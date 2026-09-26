import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Scan', to: '/' },
  { label: 'Issue Explorer', to: '/issues' },
  { label: 'Graph View', to: '/graph' },
];

export default function Sidebar() {
  // Initialise from localStorage so preference survives page reload
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('cp-theme') === 'dark'; } catch { return false; }
  });

  // Apply / remove the data-theme attribute on <html> whenever dark changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem('cp-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">CodePulse</div>
      <nav>
        <ul className="sidebar-nav">
          {navItems.map(({ label, to }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  ['sidebar-link', isActive ? 'sidebar-link--active' : ''].join(' ').trim()
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Dark / Light toggle pinned to sidebar bottom */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="dark-toggle-btn"
          onClick={() => setDark((d) => !d)}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="dark-toggle-icon" aria-hidden="true">
            {dark ? '☀' : '☽'}
          </span>
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}
