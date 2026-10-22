# Prerequisites and execution
Node24/npm dependencies, generated Prisma client, Playwright matching Chromium and disposable PostgreSQL. No production secrets required.

1. npm ci
2. npm run db:generate (before starting processes; Windows DLL may be locked if another process is running)
3. npm run test:e2e:install
4. Set CAR_TEST_DATABASE_URL to an explicitly named localhost car_security_test_* database, then npm run test:e2e.

Windows alternative: ./scripts/run-local-database-tests.ps1 -PostgresBin '<trusted portable PG bin>' -Suite e2e. The helper creates/stops its own database cluster. Existing unit/real DB suites remain npm run test:api and npm run test:api:database.

Targeted runs: append `-- --grep '<title pattern>'` to npm run test:e2e, or pass `-E2eArgs @('--grep','<title pattern>')` to the Windows helper. Each invocation still creates its own schema/servers. To view the retained HTML report: `npx playwright show-report .cache/e2e/<run-id>/report`. Never reuse failed-run service URLs; those processes are stopped.

Reports live in .cache/e2e/<run-id>/report with summary.json/results and retained failure artifacts; runner prints the exact directory. Data/schema and servers cleaned in finally. API-only new catalog/media functionality is not represented as a browser UI. No live Google login/email/model sourcing/payments/storage deployment is certified. See coverage.md and verification.md for actual results/gaps. CI uses its own PostgreSQL service and matching Chromium; no deployment credentials.

latest.json identifies the most recent invocation and its full/focused scope; latest-full.json and latest-focused.json are separate pointers. A passing focused rerun does not turn a failing full regression green. The verification record links both reports explicitly.
