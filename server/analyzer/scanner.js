/**
 * scanner.js — CodePulse file-level scanner
 *
 * Walks a repo directory, reads every .js and .ts file, and runs each
 * rule against each line. Returns an array of findings.
 *
 * Finding shape:
 *   id          - rule id (e.g. "SEC-001")
 *   category    - issue category string
 *   severity    - 'high' | 'medium' | 'low'
 *   file        - relative path from repoRoot
 *   line        - 1-based line number
 *   snippet     - the matched source line (trimmed)
 *   description - human-readable explanation of the matched pattern
 */

const fs = require('fs');
const path = require('path');
const rules = require('./rules');

// Directories to skip during traversal
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.bob']);

/**
 * Recursively collect all .js and .ts files under a directory.
 * @param {string} dir  Absolute path to start from
 * @param {string} root Absolute repo root (for relative path calculation)
 * @returns {string[]}  Array of absolute file paths
 */
function collectFiles(dir, root) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, root));
    } else if (/\.[jt]sx?$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Scan a single file against all rules.
 * @param {string} filePath  Absolute path to the file
 * @param {string} repoRoot  Absolute repo root for relative path in output
 * @returns {object[]}       Array of findings from this file
 */
function scanFile(filePath, repoRoot) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const lines = content.split('\n');
  const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  const findings = [];

  for (const rule of rules) {
    // If the rule has a file-level guard, skip the file entirely if it fails
    if (rule.fileCheck && !rule.fileCheck(content)) continue;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (rule.pattern.test(line)) {
        findings.push({
          id: rule.id,
          category: rule.category,
          severity: rule.severity,
          file: relPath,
          line: i + 1,
          snippet: line.trim(),
          description: rule.description,
        });
        // One finding per rule per file (avoid flooding the same file multiple times
        // for the same pattern — e.g. multiple == on different lines)
        // Exception: SEC-001 and SEC-002 are distinct per-line issues
        if (!['SEC-001', 'SEC-002'].includes(rule.id)) break;
      }
    }
  }

  return findings;
}

/**
 * Scan an entire repository.
 * @param {string} repoRoot  Absolute or relative path to the repository root
 * @returns {object[]}       Sorted array of all findings
 */
function scanRepo(repoRoot) {
  const absRoot = path.resolve(repoRoot);
  const files = collectFiles(absRoot, absRoot);
  const allFindings = [];

  for (const file of files) {
    allFindings.push(...scanFile(file, absRoot));
  }

  // Sort: high severity first, then by file, then by line
  const severityOrder = { high: 0, medium: 1, low: 2 };
  allFindings.sort((a, b) => {
    const sev = severityOrder[a.severity] - severityOrder[b.severity];
    if (sev !== 0) return sev;
    if (a.file < b.file) return -1;
    if (a.file > b.file) return 1;
    return a.line - b.line;
  });

  return allFindings;
}

module.exports = { scanRepo, scanFile, collectFiles };
