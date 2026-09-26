# CodePulse — AI Application Issue Explorer
## 36-Hour Hackathon MVP Blueprint

**Problem:** Developers often know that something is wrong, but understanding the root cause, execution path, and affected components requires manual investigation.

**Solution:** CodePulse analyzes a codebase, identifies potential issues, explains them using code evidence, and visualizes how they connect across the application.

**Core workflow:** Scan → Detect → Understand → Visualize → Fix → Re-scan

## 1. Product Vision
CodePulse is a developer workflow tool that helps developers understand problems inside an application before they become expensive to debug or release. It is not positioned as only a security scanner, bug detector, or dependency checker. It is a unified issue understanding layer that connects detection, explanation, and application context.

One-sentence pitch: CodePulse helps developers find, understand, trace, and fix application issues by combining automated code analysis, AI explanations, and interactive application visualization.

## 2. Issue Categories
- Bugs & Logic: Incorrect conditions, unsafe assumptions, null/undefined flows, suspicious logic
- Error Handling: Unhandled errors, weak error propagation, missing validation
- Security: Common insecure patterns, exposed secrets, missing security checks
- API & Data Flow: Unexpected request flow, unsafe input usage, inconsistent handling
- Dependencies & Configuration: Suspicious configuration, environment mistakes, dependency-related risks
- Performance: Potentially expensive operations, repeated queries, inefficient flows

Note: pick a small reliable subset for the demo, not all categories.

## 3. Core Experience
1. Scan — analyze a selected JS/TS repository
2. Detect — identify potential issues using focused rules and code relationships
3. Understand — generate a grounded explanation from the finding and relevant source code
4. Trace — show the path through routes, functions, services, APIs, data operations
5. Visualize — highlight affected components in an interactive application graph
6. Fix — provide a practical remediation direction and suggested tests
7. Re-scan — run the analysis again and show the changed result

## 4. Issue Explorer structure
- WHERE: File, function, route, component, or relevant location
- EVIDENCE: Code pattern or relationship that triggered the finding
- HOW: How the issue can occur through the application's flow
- WHY: Why the behavior may be problematic
- IMPACT: Connected components or operations that may be affected
- FIX: Suggested remediation and useful verification tests

## 5. Application Visualization
Example path: User Request → API Route → Middleware → Controller → Service → Database
When an issue is selected, the relevant nodes and connections are highlighted.

## 6. AI's Role
AI should not replace deterministic analysis. The scanner provides evidence and relationships; the AI turns that information into an understandable explanation.
Grounding rule: the explanation should reference the evidence provided by the analyzer and clearly distinguish detected facts from inference.

## 7. Technical Architecture
- Frontend: React dashboard, issue list, issue explorer, graph visualization
- Backend: Node/Express API for repository analysis and results
- Analyzer: File reader + focused pattern checks + basic relationship extraction
- AI Layer: Explanation and remediation guidance grounded in analyzer output
- Graph Builder: Converts discovered relationships into graph nodes and edges
Pipeline: Repository → Analyzer → Findings + Relationships → AI Explanation → Dashboard + Graph

## 8. Recommended MVP Scope
Implement: JS/TS support, repository scan, 3-5 reliable issue rules, issue explorer, one interactive application graph, AI explanations, re-scan.
Do not implement: full GitHub integration, real-time monitoring, multiple languages, advanced AST infrastructure, complete security coverage, pull-request automation, deployment analysis, multiple graph modes.

## 9. Demo Scenario
- Open CodePulse and select the sample project
- Run Scan and show the issue summary
- Open one bug/logic issue and inspect its evidence and explanation
- Open another category (API, security, or error-handling issue)
- Show the application graph and highlight the affected path
- Apply a fix to the sample code
- Re-scan and show the updated result

## 10. Final Pitch
"CodePulse helps developers understand application issues, not just find them. It analyzes a codebase, explains why a problem can occur using code evidence, traces its impact through connected components, and visualizes the affected path so developers can fix and verify issues faster."

Technical credibility principle: Clearly distinguish confirmed detections from potential or inferred risks. Show the evidence behind a finding and avoid claiming that static analysis proves runtime behavior it cannot verify.