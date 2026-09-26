// FIXED (SEC-001): Secrets loaded from environment variables
module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  apiKey:    process.env.AUTH_API_KEY,
};
