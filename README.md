# ⚡ CodePulse

> Find the issue. Understand the evidence. Trace the impact.

CodePulse is a lightweight issue explorer for JavaScript/TypeScript codebases. It scans a project, flags a focused set of security, logic, error-handling, API/data-flow, and performance issues, and helps you understand each one — not just where it is, but the evidence behind it, where it sits in the application flow, and how to fix it.

**🔗 Live demo:** [Add your deployed URL here]

Built for the **IBM Bob 2.0 Hackathon**. Development sessions are in [`bob_sessions/`](./bob_sessions).

---

## How it works

Two parts:

- **`server/`** — Express API. Scans a project, runs it through the detection rules, builds the application-flow graph, and serves the results as JSON.
- **`client/`** — React + Vite dashboard (Dashboard, Issue Explorer, Graph View) that consumes that API.

```
Codebase → Scanner → Findings → Flow Graph + Explanations → Dashboard
```

---

## The 9 rules

Regex-based, matched line by line:

| Rule | Category | Severity | Detects |
|---|---|---:|---|
| `LOGIC-001` | Bugs & Logic | Medium | Loose `==` instead of `===` |
| `ERR-001` | Error Handling | High | Async routes without error handling |
| `SEC-001` | Security | High | Hardcoded secrets / API keys |
| `SEC-002` | Security | High | String-built SQL queries |
| `API-001` | API & Data Flow | High | Client-controlled `isAdmin` |
| `PERF-001` | Performance | Medium | DB calls inside loops |
| `LOG-001` | Bugs & Logic | Low | Leftover `console.log/debug/dir` |
| `SYNC-001` | Performance | Low | Synchronous filesystem calls |
| `INPUT-001` | Security | Low | Raw request input in a response/render |

The scanner reports one finding per rule per file to keep noise down — except `SEC-001` and `SEC-002`, which report every matching line, since each occurrence is its own exposure.

---

## Exploring a finding

Every finding is presented the same way: **Where → Evidence → How → Why → Impact → Fix.**

The scanner supplies the file, line, snippet, severity, category, and description. The dashboard builds the rest of that story around it.

### Application flow graph

Findings are mapped onto a simple pipeline — `User Request → API Route → Middleware → Controller → Service → Database` — and the nodes a finding touches light up depending on the rule. A SQL injection finding, for example, highlights the full path from the API route to the database, since that's how the tainted input travels.

This mapping is deterministic and rule-based, not a real runtime call graph — it shows where an issue *type* typically lives, not a traced execution path.

---

## AI layer — current state

The intended design is **deterministic analysis for evidence, AI for explanation**. Right now, `server/ai/index.js` is a placeholder — the explanations shown in the dashboard come from a static file, `server/data/explanations.json`, hand-written for the bundled demo projects.

The natural next step is replacing that lookup with a real model call, fed the finding, its code evidence, and its graph context, to generate grounded explanations and fixes on the fly.

---

## Before & after

Three sample Express apps ship with the project — an e-commerce API, a blog API, and an auth service — each with a "before" and a fixed "after" version:

```
Before → Scan → Findings → Fix → Scan again → After
```

This lets the dashboard show issues actually disappearing once the code is fixed, rather than just describing what a fix would look like.

---

## Running locally

```bash
git clone https://github.com/priyanshu2734/codepulse.git
cd codepulse
```

From the root, `npm install` then `npm run dev` starts both apps together. Or run them separately:

```bash
# server — http://localhost:3001
cd server && npm install && npm run dev

# client — http://localhost:5173
cd client && npm install && npm run dev
```

## Testing

```bash
cd server
npm test
```

Covers all 9 rules with positive and counterexample cases, plus a full repository scan and a check that `node_modules` gets excluded.

---

## Known limitations

- Detection is regex/line-based, not AST-based
- The flow graph is a fixed mapping, not a real call graph
- Explanations are pre-written for the bundled demo projects, not generated live
- Only 9 rules — this isn't a substitute for a full SAST tool

## What's next

- Real AI/LLM integration for the explanation layer
- AST-based analysis
- More security and performance rules
- Deeper data-flow tracking
- Automated verification tests
- GitHub / CI integration

---

## 🤖 IBM Bob 2.0

Built for the IBM Bob 2.0 Hackathon, using Bob throughout for implementation, debugging, code understanding, and iteration. Development history: [`bob_sessions/`](./bob_sessions)

<p align="center">

### ⚡ CodePulse
**Find the issue. Understand the evidence. Trace the impact.**

</p>

