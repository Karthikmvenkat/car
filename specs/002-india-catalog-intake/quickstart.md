# Validation guide

Run `npm run db:generate`, `npm run typecheck:api`, `npm run test:api`, `npm run check:ui-baseline`, `npm run typecheck`, `npm run build:api`. Never run migrate/dev/push against an existing environment here.

Database verification: existing `scripts/run-local-database-tests.ps1 -PostgresBin <portable-bin>` helper, or explicitly guarded localhost CAR_TEST_DATABASE_URL and `npm run test:api:database`. See [foundation guide](../001-production-baseline/quickstart.md). Runner applies migrations to a fresh owned schema and removes only that schema. All content synthetic.

Scenarios: anonymous/customer/analyst rejection; inventory denied source approval; nested unknown/invalid units rejected; approved source plus evidenced IN/NEW identity prepares pending candidate; identical retries deduplicate; conflicting keys fail; acceptance stays private and creates no Vehicle; permission expiry/revocation/stale evidence block acceptance; competing review leaves one audit; audit failure rolls back; demoted actors cannot mutate.

No UI preview required because frontend files/routes are unchanged. Actual source onboarding, media processing, public adapters and staging migration review remain future gates.
