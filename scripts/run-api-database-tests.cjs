const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabaseUrl, newTestSchema, requireOwnedSchema } = require('./lib/test-database.cjs');

const workspace = path.resolve(__dirname, '..');

async function run() {
  // No dotenv, DATABASE_URL fallback, database reset, or production connection.
  const base = requireTestDatabaseUrl(process.env.CAR_TEST_DATABASE_URL);
  const schema = newTestSchema();
  const scoped = new URL(base);
  scoped.searchParams.set('schema', schema);
  base.searchParams.set('schema', 'public');
  const admin = new PrismaClient({ datasources: { db: { url: base.toString() } } });
  let created = false;
  try {
    await admin.$connect();
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${requireOwnedSchema(schema)}"`);
    created = true;
    const env = {
      ...process.env, NODE_ENV: 'test', DATABASE_URL: scoped.toString(),
      CAR_TEST_DATABASE_URL: scoped.toString(), CAR_TEST_DATABASE_SCHEMA: schema,
      CAR_API_DATABASE_TESTS: '1',
    };
    const migration = spawnSync(process.execPath, [
      require.resolve('prisma/build/index.js'), 'migrate', 'deploy', '--schema', 'prisma/schema.prisma',
    ], { cwd: workspace, env, stdio: 'pipe', encoding: 'utf8' });
    if (migration.error || migration.status !== 0) {
      // Do not print potentially credential-bearing CLI errors or inherited env.
      throw new Error('Could not apply repository migrations to the isolated test schema');
    }
    process.stdout.write('Repository migrations applied to a fresh, owned test schema.\n');
    const tests = spawnSync(process.execPath, [path.join(__dirname, 'run-api-tests.cjs'), ...process.argv.slice(2)], {
      cwd: workspace, env, stdio: 'inherit',
    });
    if (tests.error) throw new Error('Unable to start database tests');
    process.exitCode = tests.status ?? 1;
  } finally {
    try {
      if (created) {
        // Only the unpredictable schema created above is removed. Never a DB,
        // public schema, caller-selected schema, or any filesystem directory.
        await admin.$executeRawUnsafe(`DROP SCHEMA "${requireOwnedSchema(schema)}" CASCADE`);
        process.stdout.write('Owned test schema removed.\n');
      }
    } finally {
      await admin.$disconnect();
    }
  }
}

run().catch(() => {
  process.stderr.write('Disposable database verification failed. Check localhost test configuration and runtime; no live database fallback is permitted.\n');
  process.exitCode = 1;
});
