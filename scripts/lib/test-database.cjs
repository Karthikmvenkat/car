const crypto = require('node:crypto');

function requireTestDatabaseUrl(value) {
  if (!value) throw new Error('Set CAR_TEST_DATABASE_URL to an explicitly disposable localhost database. DATABASE_URL is never used.');
  let url;
  try { url = new URL(value); } catch { throw new Error('Invalid disposable database URL'); }
  if (!['postgresql:', 'postgres:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      !/^\/car_security_test_[a-z0-9_]+$/.test(url.pathname) ||
      !url.username || url.hash) {
    throw new Error('Database tests require localhost and a database named car_security_test_<name>');
  }
  const allowed = new Set(['schema', 'connection_limit', 'connect_timeout', 'pool_timeout', 'socket_timeout', 'sslmode']);
  for (const key of url.searchParams.keys()) if (!allowed.has(key)) throw new Error('Unsupported disposable database connection option');
  return url;
}

function newTestSchema() {
  return 'security_test_' + crypto.randomUUID().replaceAll('-', '');
}

function requireOwnedSchema(schema) {
  if (!/^security_test_[a-f0-9]{32}$/.test(schema ?? '')) throw new Error('Invalid owned test schema');
  return schema;
}

module.exports = { requireTestDatabaseUrl, newTestSchema, requireOwnedSchema };
