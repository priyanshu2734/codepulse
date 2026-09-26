# CodePulse

> CodePulse helps developers find, understand, trace, and fix application issues by combining automated code analysis, AI explanations, and interactive application visualization.

## Stack

- **Frontend:** React 18 + Vite (port 5173)
- **Backend:** Node.js + Express (port 3001)

## Setup

<!-- TODO: fill in once dependencies are installed -->

```bash
# Install all dependencies
npm install          # root (concurrently)
npm install --prefix server
npm install --prefix client

# Run both servers with one command
npm run dev
```

## Architecture

```
Repository → Analyzer → Findings + Relationships → AI Explanation → Dashboard + Graph
```

| Folder | Responsibility |
|--------|---------------|
| `server/routes/` | Express API routes |
| `server/analyzer/` | File reading + pattern checks |
| `server/ai/` | AI explanation layer (grounded in analyzer output) |
| `server/graph/` | Converts relationships into graph nodes and edges |
| `client/src/pages/` | Dashboard, Issue Explorer, Graph View |
| `client/src/components/` | Sidebar, TopBar |

## Issue Categories (MVP)

Bugs & Logic · Error Handling · Security · API & Data Flow · Performance

## API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/scan` | Run analysis; returns `{ findings: [] }` |

## Usage

<!-- TODO: add demo scenario steps -->

## Roadmap

<!-- TODO: fill in after hackathon -->
