// Synthetic signing key only; tests do not load dotenv or the full application.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'synthetic-test-signing-key-not-for-production-001';
