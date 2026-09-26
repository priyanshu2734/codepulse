// Application configuration
// ISSUE: Hardcoded API secret — should be loaded from environment variables
const config = {
  port: 4000,
  apiSecret: 'sk_live_4f8g9h2j3k5l6m7n8p9q0r1s',
  stripeKey: 'sk_live_abcdef1234567890abcdef1234567890',
  jwtSecret: 'mysupersecretjwtkey123',
  db: {
    path: './data/shop.db',
  },
};

module.exports = config;
