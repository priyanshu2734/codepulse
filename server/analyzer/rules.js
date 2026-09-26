/**
 * rules.js — CodePulse analyzer rule definitions
 *
 * Each rule describes one detectable pattern.
 * Fields:
 *   id          - unique rule identifier
 *   category    - one of the blueprint issue categories
 *   description - short human-readable description of what is matched
 *   pattern     - RegExp tested against each line of source code
 *   severity    - 'high' | 'medium' | 'low'
 *
 * Design principle: rules target high-confidence patterns that reliably indicate
 * a problem. Each pattern must be grounded in a specific code construct, not
 * general heuristics.
 */

const rules = [
  {
    id: 'LOGIC-001',
    category: 'Bugs & Logic',
    description: 'Loose equality (==) used instead of strict equality (===), which can cause incorrect comparisons due to type coercion.',
    // Matches == that is NOT != and NOT === and NOT !==
    // Specifically: non-bang char, then ==, then non-= char
    pattern: /[^!<>=]==(?!=)/,
    severity: 'medium',
  },
  {
    id: 'ERR-001',
    category: 'Error Handling',
    description: 'Async route handler uses await without a surrounding try/catch block. Rejected promises will cause unhandled rejections.',
    // Matches async arrow or named function in a router call with await inside,
    // but we detect at the line level: an `async (req, res)` handler definition
    // that contains an await but no try block on the same line context.
    // We detect the async handler declaration line here; the scanner correlates
    // the absence of try/catch in the surrounding block in the file-level pass.
    pattern: /router\.(get|post|put|patch|delete)\s*\([^,]+,\s*async\s*\(/,
    severity: 'high',
    // Extra check: the file must also contain `await` but no `try` block
    fileCheck: (content) => /\bawait\b/.test(content) && !/\btry\s*\{/.test(content),
  },
  {
    id: 'SEC-001',
    category: 'Security',
    description: 'Hardcoded API secret, key, or token found in source code. Secrets should be loaded from environment variables.',
    // Matches common secret key patterns: sk_live_, apiSecret, apiKey, jwtSecret assigned to a string literal
    pattern: /(api[_-]?secret|api[_-]?key|jwt[_-]?secret|sk_live_|stripe[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    severity: 'high',
  },
  {
    id: 'SEC-002',
    category: 'Security',
    description: 'SQL query constructed by concatenating user-controlled input. This is vulnerable to SQL injection.',
    // Matches: SQL keyword anywhere on the line, followed by a + concatenation with a variable.
    // [^;]* allows for the closing quote and whitespace before the + operator.
    pattern: /(SELECT|INSERT|UPDATE|DELETE)[^;]*\+\s*\w/i,
    severity: 'high',
  },
  {
    id: 'API-001',
    category: 'API & Data Flow',
    description: 'Client-supplied "isAdmin" or role field read directly from request body and used for access control without server-side validation.',
    // Matches destructuring isAdmin/role/isOwner from req.body
    pattern: /\breq\.body\b[^;]*\bisAdmin\b|\bconst\s*\{[^}]*\bisAdmin\b[^}]*\}\s*=\s*req\.body/,
    severity: 'high',
  },
  {
    id: 'PERF-001',
    category: 'Performance',
    description: 'Database query called inside a loop (for/while/forEach). This causes N+1 queries. Use a single batched query instead.',
    // Two-line detection: we look for an await + DB call keyword appearing inside
    // a for/while loop. We detect the await line; the scanner checks loop context.
    pattern: /\bawait\b.*\b(db\.|query|findOne|findAll|getUser|getOrder|getUserFor)/,
    severity: 'medium',
    // Extra check: the file must contain a for...of or forEach loop
    fileCheck: (content) => /\bfor\s*\(|\bforEach\b/.test(content),
  },
  // ── Low-severity rules ──────────────────────────────────────
  {
    id: 'LOG-001',
    category: 'Bugs & Logic',
    description: 'console.log() call left in production code. Debug output leaks internal state and application details to server logs.',
    pattern: /\bconsole\.(log|debug|dir)\s*\(/,
    severity: 'low',
  },
  {
    id: 'SYNC-001',
    category: 'Performance',
    description: 'Synchronous file system call (fs.readFileSync / fs.writeFileSync) used in a request path. Blocks the Node.js event loop for the duration of the I/O operation.',
    pattern: /\bfs\.(readFileSync|writeFileSync|existsSync|mkdirSync)\s*\(/,
    severity: 'low',
  },
  {
    id: 'INPUT-001',
    category: 'Security',
    description: 'User-supplied string used directly in a response or template without sanitisation. Could enable stored XSS or response injection in HTML contexts.',
    // Matches req.body / req.query / req.params fields fed directly into res.send/json/render
    pattern: /res\.(send|render)\s*\(\s*req\.(body|query|params)/,
    severity: 'low',
  },
];

module.exports = rules;
