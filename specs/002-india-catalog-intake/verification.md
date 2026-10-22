# Catalog intake verification

## Pre-implementation consistency review
FR001/002 ->US1/T003-T004; FR003/004/005 ->US2/T005-T006; FR006 ->US3/T007-T008; FR007 ->T008/T009; FR008 ->T003/T005/T007/T009. Every story has independent acceptance criteria and implementation tasks; no unresolved requirements or constitutional violations. Read-only research confirmed separate module boundaries, fixed policy version, server-role recheck and permission revalidation. No plan claims full catalog/media completion.

Spec quality checklist:16/16 passed. Spec Kit setup-plan/setup-tasks succeeded; all hooks skipped because extensions.yml is absent. Actual git branch remains codex/001-production-baseline (Spec Kit feature label002 is not a git branch change).

## Results
Verified 2026-10-17 on codex/001-production-baseline:

| Check | Result |
|---|---|
| Synthetic/API/request tests | 6 suites, 364 passed, 0 failed |
| Real PostgreSQL tests | 2 suites, 20 passed, 0 failed; 14 catalog + 6 foundation |
| Prisma schema validation | Passed |
| Prisma generation | Fresh isolated cache generation passed; see local DLL note below |
| API typecheck and build | Passed |
| Web typecheck | Passed |
| UI source integrity | 92 original files unchanged; no frontend additions |
| Whitespace check | git diff --check passed |
| CI workflow | Parsed locally; paths now include all specs; GitHub execution awaits push |

Test results are retained in ignored .cache/api-test-results.json and .cache/api-database-test-results.json. PostgreSQL migrations applied only to fresh runner-owned schemas; schemas removed, fixture processes stopped and fixture password files removed. No live database, actual source approval, network acquisition, payment, deployment or public catalog change occurred.

Database proof includes forced overlapping real reads for identical-key intake and competing reviews; one candidate/one final review audit survives. Conflicting keyed payloads preserve original content. Revocation removes current eligibility without rewriting accepted history. Expired/revoked/stale-sale/stale-fact inputs cannot be accepted. Demoted actors cannot mutate. Real PostgreSQL audit rejection rolls back source approval, candidate preparation, review and revocation. Candidate pagination is bounded and no legacy Vehicle is created by the full prepare/accept/revoke path.

The first database run exposed an async assertion mismatch for invalid source expiry (a synchronous service throw). Source registration now consistently returns a rejected promise; the full suite passed afterward. Normalization is covered with positive/range/unit/duplicate/host/freshness checks; request tests exercise actual JWT/current-role guards and global implicit conversion settings. Explicit transforms prevent string flags from becoming true or string numbers from becoming facts.

## Local generated-client limitation
Normal Prisma generation wrote new client code/types but could not overwrite an existing Windows engine DLL locked by another process. No process was stopped. Fresh generation to .cache/catalog-prisma-generation/client succeeded; its engine checksum matches the installed DLL. The generated schema metadata file was synchronized to the repository schema after the partial normal generation. Real PostgreSQL suites verified that the installed generated client uses the new models. CI/clean installs should run normal generation before starting processes; this is a local file lock, not a migration or dependency change.

## Scope and remaining gates
This completes private catalog intake/review only. There is no source connector, scraping, image binary upload/decoding, private object storage integration, derivative generation, public publisher, legacy media backfill or booking change. The current eligibility flag is a preparation signal, not sufficient authorization for a future public publisher: that publisher must also gate media rights/attribution and every legacy publication path. Actual sources require permission evidence reviewed by authorized staff. Acceptance does not assert legal compliance or guarantee current stock.

The additive migration has not been applied to an existing environment; review/staging/backup gates still apply. Existing unrelated work is preserved. Existing frontend lint debt remains 20 errors/21 warnings from the foundation record and is outside this change; lint was not rerun. No commits, push, PR or deployment performed. All extension hooks were skipped because extensions.yml is absent.
