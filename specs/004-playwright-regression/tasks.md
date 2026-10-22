# Tasks: Playwright regression
Inputs: spec/plan/research/data-model/contracts. Tests are the feature.
## Foundation
- [x] T001 Add guarded lifecycle and synthetic seed in scripts/run-e2e.cjs and scripts/lib/e2e-seed.cjs; extend portable DB helper with Suite=e2e.
- [x] T002 Configure pinned Playwright and desktop/mobile/API projects in playwright.config.ts, root package scripts and e2e/support fixtures; artifacts ignored.
## US1 customer
- [x] T003 [US1] Add browser discovery/detail/favorites/compare/auth/profile/lead/test-drive/finance journeys in e2e/customer.browser.spec.ts.
## US2 staff/API
- [x] T004 [US2] Add staff browser login/records/status smoke and actual legacy CRUD/auth/configuration API tests in e2e/staff.browser.spec.ts and e2e/legacy.api.spec.ts.
- [x] T005 [US2] Add complete source/candidate/media rights/review/withdrawal HTTP workflows in e2e/catalog-media.api.spec.ts.
## US3 trustworthy verification
- [x] T006 [US3] Inventory and smoke web routes, document preview/external/gaps in e2e/routes.browser.spec.ts and specs/004-playwright-regression/coverage.md.
- [x] T007 [US3] Add isolated least-privilege CI in .github/workflows/playwright.yml and execution guide in specs/004-playwright-regression/quickstart.md.
- [x] T008 Run suite/checks, preserve actual failures/findings and cleanup evidence in specs/004-playwright-regression/verification.md.

Dependencies:T001/T002->T003/T004/T005/T006->T007/T008. Spec files can be authored independently once fixtures exist; tests run serially to keep initial mutable-fixture assertions deterministic. No new agents required beyond read-only plan research. Checklist8/8 passed. Consistency: FR001/002/007->T001/T002;FR003->T003;FR004->T004/T005;FR005/006->T006/T008;FR008->T007/T008. All requirements mapped, no constitution conflict. Hooks absent.
