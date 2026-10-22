# Verification and Convergence: Secure Production Baseline

Date: 2026-10-17. Branch `codex/001-production-baseline`; base commit `7ec4e718c9d81125467d1551387ddcc5c21a8fa5`. Local implementation, no commit/push/deployment. Node 24.20.0, npm 11.19.0, official Specify CLI 1.2.1, bundled Python 3.12.14.

## Implemented

Explicit inventory/sales/content/user roles on legacy staff methods; default-denying role guard; current active-account/role lookup on protected JWT requests; database-only authentication and sanitized outage/recovery; production signing config validation; typed role mutation with serializable actor revalidation, last-admin/self-lockout checks, atomic audit and bounded conflict retry. Shared AVAILABLE+PUBLISHED predicate covers vehicles, public brand relations/counts, configurator list/detail/variants/save/share and public enquiry/test-drive lookup. Guest body userId cannot attach someone else's account. Unexpected errors are generic.

Deliberate compatibility change: legacy status=AVAILABLE alone no longer publishes a vehicle. publicationStatus=PUBLISHED is also required through the existing authorized publication flow. Legacy create/update model-connection defects, photo-mode auto-publication, source rights and media provenance remain catalog/media follow-up work; no production records were modified or declared ready.

## Checks actually run

| Check | Observed result | Limit |
|---|---|---|
| Initial API/web no-emit checks | Passed before edits | compile, not runtime |
| Final npm run typecheck:api | Passed | API source compilation |
| Web no-emit after backend edits | Passed | frontend unchanged |
| Final npm run build:api | Passed; dist/main.js exists | no real infrastructure startup |
| API regression suite | **3 suites, 264 tests passed** | real localhost HTTP/guards/tokens/validation; mocked persistence/providers |
| npm run check:ui-baseline | **92 frontend files unchanged**, no additions | source integrity, not screenshot parity |
| Original untracked-file hash comparison | **49 original files unchanged**, none missing | pre-existing work preserved; new feature files separate |
| Existing ESLint config directly over web sources | **20 errors, 21 warnings** in unchanged frontend | pre-existing release debt; not fixed in backend slice |
| git diff --check | Passed | generated untracked artifacts reviewed separately |
| Spec Kit check-prerequisites RequireSpec/RequireTasks/IncludeTasks | Passed | workflow structure, not semantic automation |

Test summary is in ignored `.cache/api-test-results.json`. Jest filesystem realpath checks were blocked in sandbox; approved runs outside it used only synthetic persistence and localhost. Scratch/cache remains in ignored workspace `.cache`. Next lint wrapper attempted dependency installation after sandbox resolution failure; it was stopped. No tracked lockfile/frontend manifest/config changes resulted. Direct existing ESLint then established the actual errors without installing dependencies.

## Traceability

| Requirement | Evidence |
|---|---|
| FR-001 | controller/role policy; 27 legacy privileged operations × guest/seven roles in authorization.http.spec.ts |
| FR-002 | real JwtStrategy/AuthService tests for stale claims/demotion, inactive/deleted accounts and invalid tokens |
| FR-003 | no demo store; login/register outage and later recovery tests |
| FR-004 | shared jwt-config tests for absent/short/known-example production configuration |
| FR-005 | serializable UsersService actor/count/write/audit/retry, DTO HTTP tests and mocked transaction invariants |
| FR-006 | shared visibility predicate, brand/submission/configurator tests, guest spoofing and page-limit tests |
| FR-007 | ui-baseline.json/script; no schema/lock/functions changes or external operation |
| FR-008 | actual test/type/build/lint evidence and remaining gates here |

## Consistency and independent review

Spec/plan/tasks/contracts/constitution reviewed for the bounded feature. Read-only secondary review found brand/submission visibility bypasses; fixed with shared policy and regression tests. Configurator visibility was aligned. No policy contradiction/schema migration/UI redesign remains in this slice. Requirement-quality checklist passed before implementation; that is not production acceptance.

At the initial milestone, SC-003 was verified only with mocked transactions. The convergence pass below adds actual isolated PostgreSQL evidence. No live/production database query, credential access, migration or seed was performed. This remains local verification, not production certification.

## Remaining release gates

1. Browser baseline screenshots and existing frontend lint debt, without redesign.
2. Isolated full-application bootstrap verification and production-specific operational tests; disposable PostgreSQL transaction/race/audit-rollback evidence is now recorded below.
3. MFA, server sessions/logout/recovery, throttling/CORS, staff object scope, readiness/monitoring/backups, secret/seed review, vulnerability/license checks.
4. Reviewed India catalog/media engine, durable storage/provenance/source rights and safe photo-mode publishing.
5. Paid-request/deposit/refund/provider integration and UI-preview acceptance, including merchant/business policy gates. No live payments enabled.

## Operational notes

No migration. Do not deploy the prior unsafe policy as a production rollback; disable privileged features if necessary. Existing toggle-status is non-idempotent and should not auto-retry after ambiguous network outcomes. Development now requires a working DB for login; a missing local signing secret uses an ephemeral per-process key. Production requires configured signing material. Existing seeded demo credentials need review/rotation before deployment. Current account freshness handles demotion/suspension; complete logout revocation still needs a later session/version model.

## Convergence pass — actual PostgreSQL verification

17 October 2026. T013/T014 add an opt-in disposable database suite, connection/cleanup safeguards, a portable Windows fixture helper, and a GitHub verification workflow. Application and frontend source are unchanged by this convergence pass. No new schema/migration source was added.

| Check | Observed result |
|---|---|
| Synthetic/API regression suite with database guard tests | **4 suites / 279 tests passed** |
| Fresh portable PostgreSQL 17.11 fixture | Existing repository migrations applied successfully to one generated private test schema |
| Real transaction suite | **1 suite / 6 tests passed**: synchronized concurrent role changes; synchronized status changes; database-triggered audit failure rollback; successful atomic change/audit; self-lockout; current persisted demotion/suspension |
| Cleanup | Owned test schema removed; task-owned PostgreSQL process stopped; generated password file removed |
| API type check | Passed |
| UI source integrity | 92 files unchanged |
| Workflow YAML | Parsed successfully; read-only repository permission/disposable PostgreSQL service verified statically |
| GitHub workflow execution | **Not run on GitHub**; requires a pushed branch/PR |

The concurrency barrier aligns actual reads so both requests observe overlapping serializable snapshots. Reads, writes, constraints and audit operations use real PostgreSQL; no query results are mocked in this suite. A fixture-only trigger forces an actual database audit failure and demonstrates transaction rollback. Results establish these tested cases on PostgreSQL 17.11, not universal fault tolerance or a production infrastructure guarantee.

The runtime came from the official [EDB portable binaries page](https://www.enterprisedb.com/download-postgresql-binaries), file ID 1260616, resolving to `postgresql-17.11-5-windows-x64-binaries.zip`. Download SHA-256: `80379B2C04D51C30225532E0AE04509899141E9957ED096FE749D7FD9DF8F82F`. This is a locally recorded digest, not an independently published checksum verification. Runtime stays in the task-owned external tooling directory; no Windows service, global installation or application dependency was added.

An initial Windows launcher run waited for the server process tree; the helper was corrected to wait only for pg_ctl. That fixture was stopped, and a fresh corrected run completed successfully. No real/customer database was involved. Test caches and synthetic cluster diagnostics remain ignored in `.cache`; no binary/runtime/customer data is included in source changes.

The security workflow pins checkout/setup-node to reviewed commit SHAs, uses PostgreSQL 17 as an ephemeral service, has no production secret dependency and performs no deploy. It repeats type/unit/HTTP/database/build/UI-source checks. Existing web lint failures and the other catalog/session/operational release gates remain unchanged.
