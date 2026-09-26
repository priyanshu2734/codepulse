# CodePulse — Project Shell Setup Plan

## Overview

Scaffold the initial project shell for CodePulse: an AI-powered application issue explorer
(see blueprint.md for full product context). This plan covers only the project shell —
no real analysis, AI calls, or graph computation yet.

**Scope:**
- Node.js + Express backend in `/server` with placeholder modules
- React + Vite frontend in `/client` with navigation shell and placeholder pages
- One real API endpoint: `GET /api/scan` returning a hardcoded empty findings array
- A README.md stub

**Not in scope:** actual code analysis, AI integration, graph rendering, real scan logic.

---

## Sub-Tasks

---

### Sub-Task 1 — Backend: Express server shell

**Intent:** Create a minimal Express server with the folder structure defined in the blueprint
(`routes`, `analyzer`, `ai`, `graph`) and one working endpoint.

**Expected Outcomes:**
- `cd server && node index.js` starts a server on port 3001
- `GET http://localhost:3001/api/scan` returns `{ "findings": [] }`
- `analyzer/`, `ai/`, `graph/` directories exist with placeholder index.js files

**Todo List:**
1. Create root `package.json` with `concurrently` and a `dev` script that starts both server and client in parallel
2. Create `server/package.json` with `express` as a dependency and a `start` script
2. Create `server/index.js` — Express app, JSON middleware, mounts `/api` router, listens on port 3001
3. Create `server/routes/scan.js` — single GET `/scan` handler returning `{ findings: [] }`
4. Create `server/analyzer/index.js` — empty placeholder module with a comment
5. Create `server/ai/index.js` — empty placeholder module with a comment
6. Create `server/graph/index.js` — empty placeholder module with a comment

**Relevant Context:** blueprint §7 — Pipeline: Repository → Analyzer → Findings + Relationships → AI Explanation → Dashboard + Graph

**Status:** [ ] pending

---

### Sub-Task 2 — Frontend: React + Vite shell

**Intent:** Create a Vite + React project in `/client` with a minimal app shell — sidebar navigation
and top bar — wired up with React Router so each nav item renders its target page.

**Expected Outcomes:**
- `cd client && npm run dev` opens a working app in the browser
- Left sidebar shows three nav links: Scan, Issue Explorer, Graph View
- Top bar shows a static project name and a "Re-scan" button (non-functional for now)
- Navigating between links renders the correct placeholder page
- Dashboard is the default route (`/`)

**Todo List:**
1. Create `client/package.json` with `react`, `react-dom`, `react-router-dom`, and Vite dependencies
2. Create `client/vite.config.js` — standard React plugin config, proxy `/api` to `localhost:3001`
3. Create `client/index.html` — Vite HTML entry point
4. Create `client/src/main.jsx` — ReactDOM render with BrowserRouter
5. Create `client/src/App.jsx` — layout with `<Sidebar>`, `<TopBar>`, and `<Routes>` for three pages
6. Create `client/src/components/Sidebar.jsx` — nav links to `/`, `/issues`, `/graph`
7. Create `client/src/components/TopBar.jsx` — project name text + Re-scan button
8. Create `client/src/pages/Dashboard.jsx` — placeholder with "Issue Summary" heading and note
9. Create `client/src/pages/IssueExplorer.jsx` — placeholder page
10. Create `client/src/pages/GraphView.jsx` — placeholder page
11. Create `client/src/index.css` — minimal reset / layout styles for the sidebar+content shell

**Relevant Context:** blueprint §3 core experience (Scan → Detect → Understand → Trace → Visualize → Fix → Re-scan), §7 frontend components

**Status:** [ ] pending

---

### Sub-Task 3 — README and AGENTS.md

**Intent:** Add a README stub that describes the project, and an AGENTS.md that captures the
project-specific setup for AI assistants.

**Expected Outcomes:**
- `README.md` exists in the project root with name, one-sentence pitch, and section stubs
- `AGENTS.md` exists with commands and non-obvious conventions

**Todo List:**
1. Create `README.md` — title, one-line pitch, stack, and placeholder sections for Setup, Usage, Architecture
2. Create `AGENTS.md` — build/dev/test commands, folder layout, proxy config note, port convention

**Relevant Context:** blueprint §10 final pitch for README copy

**Status:** [ ] pending

---

## Implementation Order

Sub-Task 1 → Sub-Task 2 → Sub-Task 3

Each sub-task should be completed and verified before the next begins.
