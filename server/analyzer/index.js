// Analyzer — public API
// Pipeline role: Repository → Analyzer → Findings + Relationships

const { scanRepo, scanFile, collectFiles } = require('./scanner');

module.exports = { scanRepo, scanFile, collectFiles };
