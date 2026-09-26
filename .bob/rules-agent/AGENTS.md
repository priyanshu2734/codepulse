# Project Coding Rules (Non-Obvious Only)

- `server/` is CommonJS (`require`/`module.exports`). `client/` is ES modules (`import`/`export`). Never mix them.
- Vite proxies `/api/*` to port 3001. Use relative `/api/...` paths in all fetch calls — never `http://localhost:3001`.
- All CSS is in `client/src/index.css` — no CSS modules, no Tailwind. Follow the existing BEM-like naming pattern (`block-element--modifier`).
- The analyzer, AI, and graph modules (`server/analyzer/`, `server/ai/`, `server/graph/`) are empty stubs. Implement them by adding exports there; `server/routes/scan.js` is where they get wired into the HTTP response.
- `GET /api/scan` must keep the response shape `{ findings: [] }` — the client will destructure `findings` from that key.
- `node --watch` is used for server dev (built-in Node 18+ file watcher) — no nodemon needed.
