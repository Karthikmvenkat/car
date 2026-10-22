# Validation
Use npm dependencies, generated Prisma client, disposable localhost PostgreSQL and Playwright Chromium. Never run against production.
1. API/web/E2E typechecks; npm run test:api; guarded scripts/run-local-database-tests.ps1 -Suite api.
2. Guarded helper -Suite e2e -E2eArgs @('--grep','quotation'), then full suite.
3. Verify public contact submission/replay/conflict/quota, invalid consent/type/colour and unavailable car.
4. Verify all7staff-role boundaries, stale/concurrent review, audit rollback, exact totals, historical PDF bytes/hash/download headers.
5. Inspect synthetic normal/long PDFs using pypdf and rendered PNGs, never actual customer sample as fixture.
6. Check explicit UI source manifest changes; preserve original fingerprints. No production migration/import/deployment.
