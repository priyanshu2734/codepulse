/**
 * analyzer.test.js — unit tests for CodePulse scanner rules
 *
 * Run with: npm test  (from /server)
 *
 * Tests verify that each of the 5 rule IDs fires on the relevant
 * sample-project file and does NOT fire on clean counterexample code.
 */

const path = require('path');
const { scanFile, scanRepo } = require('../analyzer/scanner');

const SAMPLE = path.resolve(__dirname, '../../sample-project');

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Run scanFile against a temp virtual file by writing to a temp path.
 * Instead of writing to disk, we test via scanRepo on sample-project directly
 * for integration tests, and test rules in isolation below.
 */
const rules = require('../analyzer/rules');
const fs = require('fs');
const os = require('os');

function testRuleOnCode(ruleId, code) {
  // Write code to a temp file, scan it, return matching findings
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `codepulse-test-${ruleId}-${Date.now()}.js`);
  fs.writeFileSync(tmpFile, code, 'utf8');
  try {
    const findings = scanFile(tmpFile, tmpDir);
    return findings.filter((f) => f.id === ruleId);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

// ── LOGIC-001: Loose equality ─────────────────────────────────────────────────

test('LOGIC-001 detects loose == comparison', () => {
  const code = `
    function check(a, b) {
      if (a == b) return true;
      return false;
    }
  `;
  const findings = testRuleOnCode('LOGIC-001', code);
  expect(findings.length).toBeGreaterThan(0);
  expect(findings[0].id).toBe('LOGIC-001');
});

test('LOGIC-001 does NOT fire on strict === comparison', () => {
  const code = `
    function check(a, b) {
      if (a === b) return true;
      return false;
    }
  `;
  const findings = testRuleOnCode('LOGIC-001', code);
  expect(findings.length).toBe(0);
});

test('LOGIC-001 does NOT fire on != or !==', () => {
  const code = `if (a !== b) return; if (a != b) return;`;
  const findings = testRuleOnCode('LOGIC-001', code);
  expect(findings.length).toBe(0);
});

// ── ERR-001: Unhandled async route ────────────────────────────────────────────

test('ERR-001 detects async route handler without try/catch', () => {
  const code = `
    const router = require('express').Router();
    router.get('/:id', async (req, res) => {
      const user = await getUser(req.params.id);
      res.json(user);
    });
  `;
  const findings = testRuleOnCode('ERR-001', code);
  expect(findings.length).toBeGreaterThan(0);
  expect(findings[0].id).toBe('ERR-001');
});

test('ERR-001 does NOT fire when try/catch is present', () => {
  const code = `
    const router = require('express').Router();
    router.get('/:id', async (req, res) => {
      try {
        const user = await getUser(req.params.id);
        res.json(user);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  `;
  const findings = testRuleOnCode('ERR-001', code);
  expect(findings.length).toBe(0);
});

// ── SEC-001: Hardcoded secret ─────────────────────────────────────────────────

test('SEC-001 detects hardcoded apiSecret', () => {
  const code = `const config = { apiSecret: 'sk_live_abc123xyz456def789' };`;
  const findings = testRuleOnCode('SEC-001', code);
  expect(findings.length).toBeGreaterThan(0);
  expect(findings[0].id).toBe('SEC-001');
});

test('SEC-001 detects hardcoded jwtSecret', () => {
  const code = `const jwtSecret = 'mysupersecretkey999';`;
  const findings = testRuleOnCode('SEC-001', code);
  expect(findings.length).toBeGreaterThan(0);
});

test('SEC-001 does NOT fire when value references process.env', () => {
  const code = `const apiSecret = process.env.API_SECRET;`;
  const findings = testRuleOnCode('SEC-001', code);
  expect(findings.length).toBe(0);
});

// ── SEC-002: SQL injection ────────────────────────────────────────────────────

test('SEC-002 detects SQL string concatenation', () => {
  const code = `
    const query = "SELECT * FROM users WHERE name = '" + username + "'";
    db.all(query);
  `;
  const findings = testRuleOnCode('SEC-002', code);
  expect(findings.length).toBeGreaterThan(0);
  expect(findings[0].id).toBe('SEC-002');
});

test('SEC-002 does NOT fire on parameterised queries', () => {
  const code = `
    const query = 'SELECT * FROM users WHERE name = ?';
    db.all(query, [username]);
  `;
  const findings = testRuleOnCode('SEC-002', code);
  expect(findings.length).toBe(0);
});

// ── API-001: Client-supplied isAdmin ──────────────────────────────────────────

test('API-001 detects isAdmin read from req.body', () => {
  const code = `
    router.post('/', (req, res) => {
      const { userId, isAdmin } = req.body;
      if (isAdmin) { /* grant access */ }
    });
  `;
  const findings = testRuleOnCode('API-001', code);
  expect(findings.length).toBeGreaterThan(0);
  expect(findings[0].id).toBe('API-001');
});

test('API-001 does NOT fire when isAdmin is not in req.body', () => {
  const code = `
    router.post('/', (req, res) => {
      const { userId } = req.body;
      const isAdmin = await checkUserRole(userId); // server-side check
    });
  `;
  const findings = testRuleOnCode('API-001', code);
  expect(findings.length).toBe(0);
});

// ── PERF-001: DB query in loop ────────────────────────────────────────────────

test('PERF-001 detects await DB call inside a loop', () => {
  const code = `
    async function run() {
      const orders = await db.all('SELECT * FROM orders');
      for (const order of orders) {
        const user = await getUserForOrder(order.userId);
        results.push({ ...order, user });
      }
    }
  `;
  const findings = testRuleOnCode('PERF-001', code);
  expect(findings.length).toBeGreaterThan(0);
  expect(findings[0].id).toBe('PERF-001');
});

test('PERF-001 does NOT fire on single await outside a loop', () => {
  const code = `
    async function run() {
      const users = await db.getAll('SELECT * FROM users JOIN orders ON ...');
      return users;
    }
  `;
  const findings = testRuleOnCode('PERF-001', code);
  // No for/forEach loop present — fileCheck should prevent the rule from firing
  expect(findings.length).toBe(0);
});

// ── Integration: scan the full sample-project ─────────────────────────────────

test('scanRepo on sample-project returns at least one finding per rule', () => {
  const findings = scanRepo(SAMPLE);
  const ids = new Set(findings.map((f) => f.id));

  expect(ids.has('LOGIC-001')).toBe(true);
  expect(ids.has('ERR-001')).toBe(true);
  expect(ids.has('SEC-001')).toBe(true);
  expect(ids.has('SEC-002')).toBe(true);
  expect(ids.has('API-001')).toBe(true);
  expect(ids.has('PERF-001')).toBe(true);
});

test('every finding has required fields', () => {
  const findings = scanRepo(SAMPLE);
  for (const f of findings) {
    expect(f).toHaveProperty('id');
    expect(f).toHaveProperty('category');
    expect(f).toHaveProperty('severity');
    expect(f).toHaveProperty('file');
    expect(f).toHaveProperty('line');
    expect(f).toHaveProperty('snippet');
    expect(f).toHaveProperty('description');
    expect(typeof f.line).toBe('number');
    expect(f.line).toBeGreaterThan(0);
  }
});

test('scanRepo excludes node_modules', () => {
  const findings = scanRepo(SAMPLE);
  for (const f of findings) {
    expect(f.file).not.toContain('node_modules');
  }
});
