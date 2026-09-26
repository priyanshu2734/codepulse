const express = require('express');
const path = require('path');
const router = express.Router();
const { scanRepo } = require('../analyzer');
const { buildGraph } = require('../graph');

// Explanations are pre-authored, grounded in the detected evidence.
// Keyed by the same stable key used in graph.findingNodes: "ruleId:file:line"
const EXPLANATIONS = require('../data/explanations.json');

// Named project roots — each project has a "before" (issues present) and
// "after" (partially fixed) variant for the Before/After demo.
const PROJECTS = {
  'ecommerce': {
    label: 'sample-ecommerce-api',
    before: path.resolve(__dirname, '../../sample-project'),
    after:  path.resolve(__dirname, '../../sample-project-fixed'),
  },
  'blog': {
    label: 'sample-blog-api',
    before: path.resolve(__dirname, '../../sample-blog-project'),
    after:  path.resolve(__dirname, '../../sample-blog-project-fixed'),
  },
  'auth': {
    label: 'sample-auth-service',
    before: path.resolve(__dirname, '../../sample-auth-project'),
    after:  path.resolve(__dirname, '../../sample-auth-project-fixed'),
  },
};

// GET /api/scan?project=before|after&target=ecommerce|blog|auth
// Returns findings, graph, and explanations for the chosen project.
// Defaults to target=ecommerce, project=before.
router.get('/scan', (req, res) => {
  const targetKey  = PROJECTS[req.query.target] ? req.query.target : 'ecommerce';
  const projectKey = req.query.project === 'after' ? 'after' : 'before';
  const repoPath   = PROJECTS[targetKey][projectKey];

  try {
    const findings = scanRepo(repoPath);
    const graph = buildGraph(findings);
    res.json({
      findings,
      graph,
      explanations: EXPLANATIONS,
      project: projectKey,
      target: targetKey,
      scannedPath: repoPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects — returns the list of available scan targets
router.get('/projects', (req, res) => {
  res.json(
    Object.entries(PROJECTS).map(([key, val]) => ({ key, label: val.label }))
  );
});

module.exports = router;
