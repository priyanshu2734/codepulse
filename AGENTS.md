# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands

```bash
# Install (run once, each directory is independent)
npm install                    # root — installs concurrently
npm install --prefix server    # Express + cors
npm install --prefix client    # React + Vite + react-router-dom

# Development (starts both servers)
npm run dev                    # from project root — uses concurrently

# Individual servers
npm run dev:server             # Express on port 3001 (node --watch)
npm run dev:client             # Vite on port 5173

# Production build (client only)
npm run build --prefix client
```

## Ports & Proxy

- Express server: **port 3001**
- Vite dev server: **port 5173**
- Vite proxies `/api/*` → `http://localhost:3001` — never hardcode the backend URL in client code; always use relative `/api/...` paths.

## Project Layout

```
server/
  index.js          ← Express entry, CORS + JSON middleware, mounts /api router
  routes/scan.js    ← GET /api/scan — the only real endpoint so far
  analyzer/         ← placeholder: file reader + pattern checks
  ai/               ← placeholder: AI explanation layer
  graph/            ← placeholder: relationship → graph nodes/edges

client/src/
  App.jsx           ← layout shell: Sidebar + TopBar + Routes
  components/       ← Sidebar (nav), TopBar (project name + Re-scan)
  pages/            ← Dashboard (/), IssueExplorer (/issues), GraphView (/graph)
  index.css         ← all styles (no CSS modules, no Tailwind — plain CSS only)
```

## Key Conventions

- **No CSS framework** — all styles live in `client/src/index.css` using BEM-like class names (e.g. `sidebar-link--active`).
- **`server/` uses CommonJS** (`require`/`module.exports`) — no `"type": "module"` in `server/package.json`.
- **`client/` uses ES modules** — `"type": "module"` is set; use `import`/`export` only.
- The scan route lives at `GET /api/scan` (not POST). When the real analyzer is wired in, keep the same route shape `{ findings: [] }`.
- Blueprint is at `blueprint.md` — contains issue categories, pipeline design, and MVP scope decisions. Read it before adding new features.
