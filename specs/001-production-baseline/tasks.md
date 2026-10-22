# Tasks: Secure Production Baseline

## Phase 1: Baseline
- [x] T001 Preserve existing work and create codex/001-production-baseline; record initial API/web no-emit checks.
- [x] T002 Initialize pinned official Spec Kit 1.2.1 and define .specify/memory/constitution.md and feature artifacts.

## Phase 2: Verification harness
- [x] T003 Add apps/api/jest.config.cjs, test setup and HTTP fixture harness with real guards/tokens; expose test/typecheck scripts.

## Phase 3: US1 Explicit authorization
- [x] T004 [US1] Add role groups and fail-closed guard; protect legacy privileged controller methods.
- [x] T005 [US1] Add typed user-change DTO and serializable/audited last-super-admin-safe service changes.
- [x] T006 [US1] Prove role matrix and user-change validation/invariants with HTTP and service tests.

## Phase 4: US2 Current active identity
- [x] T007 [US2] Remove demo auth; validate shared signing configuration and load current active identity per request.
- [x] T008 [US2] Sanitize unexpected errors and test outage/recovery, inactive/deleted/stale claims and login paths.

## Phase 5: US3 Public compatibility
- [x] T009 [US3] Enforce legacy public visibility/list caps and ignore unverified guest account association.
- [x] T010 [US3] Test public guest contracts and assert existing frontend source/config hashes unchanged.

## Phase 6: Verification/convergence
- [x] T011 Run isolated tests, API/web type checks, lint/API build and Spec Kit prerequisite analysis; record actual evidence in verification.md.
- [x] T012 Review diff, preserve original untracked files, map FR-001–008 to tests, and record remaining release gates.

Dependencies: T001/002 -> T003 -> T004/007/009 -> T005/006/008/010 -> T011/012. Tasks in the same source files are sequential; independent read-only research may run concurrently. No parallel source editing is required. Each user story is independently verifiable; deliver the complete bounded feature before broader catalog/payment work.

## Phase 7: Convergence
- [x] T013 Add a guarded disposable-PostgreSQL suite and explicit runner in apps/api/test/database and scripts/run-api-database-tests.cjs to verify real last-admin races, transaction audit rollback, and current-account demotion per FR-005 / SC-003 (partial).
- [x] T014 Add a least-privilege CI verification job in .github/workflows/api-security.yml and local validation guidance in specs/001-production-baseline/quickstart.md for repeatable database/security checks without production secrets per FR-008 / plan: validation (missing).
