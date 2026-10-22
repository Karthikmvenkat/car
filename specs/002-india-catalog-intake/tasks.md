# Tasks: India catalog intake

Input: spec.md, plan.md, research.md, data-model.md and contracts/catalog-intake.md. Tests required by FR-008.

## Phase 1: Setup
- [x] T001 Record bounded contracts and consistency review in specs/002-india-catalog-intake/verification.md.

## Phase 2: Foundation
- [x] T002 Add CatalogSource/CatalogCandidate with unique(sourceId,importKey), immutable policyVersion1 and review state in prisma/schema.prisma and additive prisma/migrations/20261017000000_catalog_intake/migration.sql; apply only to test fixture.

## Phase 3: US1 approved sources
Independent test: role-gated approval/revocation with rollback if audit fails.
- [x] T003 [US1] Add permission/expiry/reference validation tests in apps/api/test/catalog-intake.spec.ts and request role tests in apps/api/test/catalog-intake.http.spec.ts.
- [x] T004 [US1] Implement source DTO/service/controller/module in apps/api/src/modules/catalog-intake/; name1..120, evidenceRef1..500, attribution1..1000 trimmed chars, all four permissions true, future validUntil; serializable actor recheck and audit.

## Phase 4: US2 prepare candidates
Independent test: evidenced IN/NEW candidate normalizes values and keyed retries deduplicate.
- [x] T005 [US2] Add normalization/deep validation/idempotency tests in apps/api/test/catalog-intake.spec.ts and apps/api/test/database/catalog-intake.postgres.spec.ts.
- [x] T006 [US2] Implement dictionary and immutable candidate intake in apps/api/src/modules/catalog-intake/; identity strings1..120, year2000..2100, facts1..16, unique fields, source-host HTTPS references<=2048, rawText1..500 and observation within90 days; six-decimal numeric conversions with dictionary ranges.

## Phase 5: US3 review
Independent test: exactly one concurrent final decision; expiry/revocation removes current eligibility without rewriting history.
- [x] T007 [US3] Add review/concurrency/expiry/audit rollback tests in apps/api/test/database/catalog-intake.postgres.spec.ts.
- [x] T008 [US3] Implement one-way reviewed candidate, note1..1000, permission/freshness gates and private lists limit1..50/default20 in apps/api/src/modules/catalog-intake/; register module in apps/api/src/app.module.ts.

## Phase 6: Verification
- [x] T009 Run synthetic/request/database tests, typechecks/build/UI hash check; record results/limits in specs/002-india-catalog-intake/verification.md.

## Dependencies and delivery
T001 ->T002 ->US1 ->US2 ->US3 ->T009. Test normalization/HTTP files may be developed in parallel after DTO contract exists, but this implementation is sequential to avoid shared-file conflicts. US1 is independently useful registry MVP; US2 adds preparation; US3 adds review. No UI/public publisher/media-byte ingestion is implied by task completion.
