// FIXED (SEC-001): API key now loaded from environment variable
module.exports = {
  apiKey: process.env.BLOG_API_KEY,
  dbHost: process.env.DB_HOST || 'localhost',
};
