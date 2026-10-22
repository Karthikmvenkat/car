# Validation Quickstart

From repository root with existing node_modules:

```powershell
npm run test:api
npm run typecheck:api
npm run check:ui-baseline
node node_modules/typescript/bin/tsc --project apps/web/tsconfig.json --noEmit --incremental false
npm run lint
npm run build:api
```

Tests use an isolated local HTTP listener, synthetic accounts and mocked persistence; no DATABASE_URL/production env is loaded or database queried. No provider/payment worker is imported. Build/type checks do not demonstrate deployed configuration, database concurrency, restore or visual rendering. Read verification.md for exact observed results and gaps. Never run migrate/seed/db push as part of these checks.

## Explicit disposable PostgreSQL verification

The opt-in database suite is separate from `test:api`. It requires an existing **disposable localhost** database named `car_security_test_<name>` and a user permitted to create/drop schemas in that database. No fallback to DATABASE_URL or .env is allowed. Never point it at real data or use a network tunnel to a live server.

```powershell
$env:CAR_TEST_DATABASE_URL = 'postgresql://car_test:fixture-only-password@127.0.0.1:55432/car_security_test_local'
npm run test:api:database
```

The runner creates a fresh unpredictable schema, applies existing repository migrations only there, executes actual PostgreSQL transaction/race/audit-rollback tests, then drops only that owned schema. It never resets/drops a database or caller-selected schema. Credentials above are illustrative fixtures, not production values. The runner rejects remote hosts, general database names and connection options that could override host selection. Loopback must terminate at a genuine disposable local database; host validation cannot detect an externally configured SSH tunnel.

On Windows, if trusted portable PostgreSQL binaries are already available:

```powershell
pwsh -File scripts/run-local-database-tests.ps1 -PostgresBin 'C:\path\to\trusted-postgresql\bin'
```

This creates a fresh cluster under ignored `.cache/postgres-tests/<run-id>`, chooses an ephemeral loopback port, uses a random fixture password, creates only a new disposable database, runs verification, and stops the process. It installs no Windows service and never edits/reuses another PostgreSQL installation. The generated password file is removed; logs/fixture data are retained in ignored cache for local diagnostics. Do not commit/cache these runtime files in public artifacts.

CI repeats API type/build/unit/HTTP/database checks using a disposable PostgreSQL 17 service, read-only repository permissions, SHA-pinned actions, no stored checkout credentials and no production secrets. The CI service version tracks PostgreSQL 17 patch updates. The workflow is written locally; it has not run on GitHub until changes are pushed/PR'd. Frontend lint debt is recorded separately; the security job does not misrepresent itself as a complete release gate.
