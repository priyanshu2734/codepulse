/**
 * graph/index.js — CodePulse relationship extractor and graph builder
 *
 * Maps each finding to the nodes in the fixed application flow it touches:
 *   User Request → API Route → Middleware → Controller → Service → Database
 *
 * Node IDs (stable, used by the frontend):
 *   user-request | api-route | middleware | controller | service | database
 *
 * Design note: mappings are deterministic and based on the rule ID + the file
 * path of the finding. We distinguish detections from inferences — file-path
 * heuristics (e.g. "file is in /routes/") confirm placement; rule semantics
 * supply the propagation direction.
 */

// ── Fixed pipeline definition ──────────────────────────────────────────────

const PIPELINE_NODES = [
  { id: 'user-request', label: 'User\nRequest',  layer: 0 },
  { id: 'api-route',    label: 'API Route',       layer: 1 },
  { id: 'middleware',   label: 'Middleware',      layer: 2 },
  { id: 'controller',   label: 'Controller',      layer: 3 },
  { id: 'service',      label: 'Service',         layer: 4 },
  { id: 'database',     label: 'Database',        layer: 5 },
];

// Edges are always left-to-right along the pipeline
const PIPELINE_EDGES = [
  { from: 'user-request', to: 'api-route'   },
  { from: 'api-route',    to: 'middleware'  },
  { from: 'middleware',   to: 'controller'  },
  { from: 'controller',   to: 'service'     },
  { from: 'service',      to: 'database'    },
];

// ── Rule → flow node mapping ───────────────────────────────────────────────
//
// Each entry lists the node IDs that are "touched" by findings of that rule.
// Rationale for each:
//
//  LOGIC-001  — loose == in a service function: logic lives at the service
//               layer; incorrect comparisons ripple up through the call chain
//               to the route that called the service, so we include controller
//               and api-route to show the affected call path.
//
//  ERR-001    — async route handler with no try/catch: the error originates
//               at the api-route layer (route handler definition), then
//               propagates back to the user when the promise rejects.
//
//  SEC-001    — hardcoded secret in a config file: config is loaded at server
//               startup, affects the whole stack. We mark middleware (where
//               auth/keys are typically applied) through database.
//
//  SEC-002    — SQL injection via string concatenation: the malicious input
//               enters at api-route, passes through controller/service, and
//               reaches the database — full path from entry to storage.
//
//  API-001    — isAdmin from req.body: the trust boundary is violated at the
//               api-route, the decision is acted upon at the controller level.
//
//  PERF-001   — N+1 query in a loop: the loop lives in service/controller
//               code; each iteration hits the database, so we mark both plus
//               the api-route that triggers the call.
//

const RULE_NODE_MAP = {
  'LOGIC-001': ['api-route', 'controller', 'service'],
  'ERR-001':   ['user-request', 'api-route'],
  'SEC-001':   ['middleware', 'controller', 'service', 'database'],
  'SEC-002':   ['user-request', 'api-route', 'controller', 'service', 'database'],
  'API-001':   ['user-request', 'api-route', 'controller'],
  'PERF-001':  ['api-route', 'controller', 'service', 'database'],
  // Low-severity rules
  'LOG-001':   ['api-route', 'controller', 'service'],
  'SYNC-001':  ['api-route', 'controller', 'service'],
  'INPUT-001': ['user-request', 'api-route'],
};

// ── File-path refinement ───────────────────────────────────────────────────
//
// For rules with broad node ranges (e.g. SEC-001), we tighten the "entry
// node" based on where the file actually lives in the project structure.
// This gives an honest answer: "we found this specifically in a config file"
// rather than always saying it starts at the route layer.
//

function entryNodeFromFilePath(filePath) {
  const p = filePath.toLowerCase();
  if (/\/routes?\/|\/controllers?\//.test(p)) return 'api-route';
  if (/\/middleware\//.test(p))               return 'middleware';
  if (/\/services?\//.test(p))               return 'service';
  if (/\/db\/|\/database\/|\/models?\//.test(p)) return 'database';
  if (/\/config\/|\/conf\//.test(p))         return 'middleware'; // config loaded by middleware
  return null; // no refinement
}

// ── Graph builder ─────────────────────────────────────────────────────────

/**
 * Build the graph payload for the frontend.
 *
 * @param {object[]} findings  Array of findings from the scanner
 * @returns {{
 *   nodes: object[],
 *   edges: object[],
 *   findingNodes: Record<string, string[]>
 * }}
 *
 * findingNodes maps a stable finding key → array of node IDs it touches.
 * The key is built from `${finding.id}:${finding.file}:${finding.line}` so
 * the frontend can identify each finding uniquely.
 */
function buildGraph(findings) {
  const findingNodes = {};

  for (const f of findings) {
    const key = `${f.id}:${f.file}:${f.line}`;
    let touchedNodes = RULE_NODE_MAP[f.id] ? [...RULE_NODE_MAP[f.id]] : [];

    // Refine entry node based on file location
    const entryNode = entryNodeFromFilePath(f.file);
    if (entryNode && touchedNodes.length > 0) {
      const entryIdx = PIPELINE_NODES.findIndex((n) => n.id === entryNode);
      const currentFirstIdx = PIPELINE_NODES.findIndex((n) => n.id === touchedNodes[0]);
      // If the detected entry node is earlier in the pipeline than the rule default,
      // extend the touched range to start from the detected entry.
      if (entryIdx !== -1 && entryIdx < currentFirstIdx) {
        const extraNodes = PIPELINE_NODES
          .slice(entryIdx, currentFirstIdx)
          .map((n) => n.id);
        touchedNodes = [...extraNodes, ...touchedNodes];
      }
    }

    findingNodes[key] = touchedNodes;
  }

  return {
    nodes: PIPELINE_NODES,
    edges: PIPELINE_EDGES,
    findingNodes,
  };
}

/**
 * Given a finding object, return its stable key used in findingNodes.
 */
function findingKey(f) {
  return `${f.id}:${f.file}:${f.line}`;
}

module.exports = { buildGraph, findingKey, PIPELINE_NODES, PIPELINE_EDGES };
