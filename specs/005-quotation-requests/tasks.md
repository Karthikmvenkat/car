# Tasks: Quotation requests

## Setup and foundation
- [x] T001 Complete spec/research/contracts/preview under specs/005-quotation-requests/; no customer sample copied.
- [x] T002 Add Prisma request/revision/throttle schema and additive migration under prisma/migrations/20261022000000_quotation_requests/; request UUID/hash, status NEW/CONTACTED/CLOSED/version>=0, immutable revisions <=2MiB and exact paise totals1..2,000,000,000.

## US1 customer request (P1)
- [x] T003 [US1] Implement strict DTOs/service/public POST in apps/api/src/modules/quotations/; phone10digits,email<=254, explicit consent, UUID replay/conflict, server car/colour snapshots and max5newrequests/contact/hour.
- [x] T004 [US1] Add accessible request/confirmation dialog apps/web/components/vehicles/QuotationRequest.tsx and existing configurator button; preview first, preserve styles and existing actions.

## US2 staff processing (P1)
- [x] T005 [US2] Implement sales-only list/detail/versioned status/audits in apps/api/src/modules/quotations/; page<=50 and no binary/PII leakage to public callers.
- [x] T006 [US2] Add Requested quotations navigation and apps/web/app/admin/quotations/page.tsx with rows/contact/status/pagination, authorization and errors.

## US3 priced PDF (P2)
- [x] T007 [US3] Implement DTO/pricing/PDF/revision/download in apps/api/src/modules/quotations/; 1..20rows,label<=100,note<=300,amountPaise integer0..2,000,000,000; exact totals; explicit review, active actor/version/audit atomicity, immutable bytes/hash and private download.
- [x] T008 [US3] Add staff preparation/review/download to apps/web/app/admin/quotations/page.tsx; issuer/customer/validity/terms fields and manual charges, no inferred rates/bank/payment promises.

## Verification
- [x] T009 Add meaningful API/PostgreSQL/E2E tests in apps/api/test/quotations.spec.ts, apps/api/test/database/quotations.postgres.spec.ts and e2e/quotations.*.spec.ts; cover7roles, replay/limits/visibility, concurrent review/audit rollback, old PDFs and mobile/desktop flow.
- [x] T010 Render and inspect synthetic normal/long PDFs, run relevant checks and full regression; record results and explicit UI fingerprints in specs/005-quotation-requests/verification.md.

Dependencies: T001->T002->T003/T005->T004/T006->T007->T008->T009->T010. Backend/frontend tasks can be parallel by file after contracts, executed sequentially here. MVP US1+US2 receives requests; complete requested delivery also requires US3. Independent tests specified in spec.md. All tasks follow checkbox/ID/story/path format.
