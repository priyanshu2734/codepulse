# Project Documentation Rules (Non-Obvious Only)

- `blueprint.md` in the project root is the canonical product spec — read it before answering questions about scope, issue categories, or pipeline design.
- The AI layer (`server/ai/`) must only explain findings produced by the analyzer — it must never invent detections. This grounding rule is defined in blueprint §6.
- Issue Explorer structure (WHERE / EVIDENCE / HOW / WHY / IMPACT / FIX) is defined in blueprint §4 — use those exact field names.
- MVP scope deliberately excludes: full GitHub integration, real-time monitoring, multiple languages, AST infrastructure, PR automation (blueprint §8).
