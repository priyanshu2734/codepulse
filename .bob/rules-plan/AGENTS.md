# Project Architecture Rules (Non-Obvious Only)

- Pipeline is strictly linear and one-directional: Repository → Analyzer → Findings + Relationships → AI Explanation → Graph nodes/edges → HTTP response. The AI layer must never call the analyzer; it only receives its output.
- The graph builder (`server/graph/`) converts analyzer-discovered relationships into nodes and edges — it does NOT perform its own code analysis.
- `server/routes/scan.js` is the single orchestration point that calls analyzer → ai → graph in sequence and assembles the final JSON. Keep orchestration there, not in the individual modules.
- React Router uses client-side routing (BrowserRouter) — no server-side routing on Express for the frontend. Express serves only `/api/*`.
- The two `package.json` files (`server/` and `client/`) are intentionally separate and independent — there is no shared `node_modules` hoisting. Root `package.json` only manages `concurrently`.
