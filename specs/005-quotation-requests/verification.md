# Quotation feature verification
2026-10-22, codex/005-quotation-requests. User chose priced PDF after staff preparation/review. Spec Kit specification, 8/8 quality checklist, research, design/contracts/tasks and consistency review completed; hooks absent. Preview shown before UI implementation.

## Implemented workflow
- Customer Request quotation action on the existing car/configurator panel; required phone/email/contact consent, validation/retry key and persisted confirmation popup.
- Dedicated sales-only Requested quotations menu and paginated row list with vehicle/variant/colour snapshot, contact details, status and actions. Personal telephone/email contact is staff initiated.
- Staff preparation, review and creation of immutable priced INR quotation revisions; historical PDF bytes/hash retained privately. Editing a previous revision copies only editable fields. Server computes paise totals and checks current identity/version atomically with audit.
- Public replay/conflict checks, persistent contact quota, no public request lookup or PDF route, private no-store downloads and server-only PDF filenames.
- Additive request/revision/throttle migration; licensed Noto Sans font packaged with its OFL, PDFKit/fontkit declared in API and function manifests. Font SHA256: b85c38ecea8a7cfb39c24e395a4007474fa5a4fc864f6ee33309eb4948d232d5. Source: https://github.com/notofonts/noto-fonts/tree/main/hinted/ttf/NotoSans . Customer source PDF and banking/customer details were not copied to repository/fixtures/defaults.

## Results
| Check | Result |
|---|---|
| Initial targeted quotation scenarios |11 passed (9 API, desktop/mobile full workflow), run85bf5543-1d15-43d6-8bb6-0689ea56109b |
| API suites |445 passed,9suites |
| Real PostgreSQL suites |38 passed,4suites; includes request concurrency/quota, revision concurrency, exact totals, audit rollback, current actor/status and corrupted-file denial |
| API/web/E2E typechecks |Passed |
| UI source integrity |86 original files preserved,6 recorded corrections (including earlier four),2 explicit additions. Existing CSS/design tokens unchanged; original capture/history retained |
| PDF validation |Synthetic normal quote1page, exact INR10,85,000.50; long quote20rows/5pages; parsed all rows/footer counts and checked character bounds; rendered and visually inspected |
| Final full regression |146 passed,0failed,0skipped,0flaky; retries disabled;28API+59desktop+59mobile;8.6minutes;run ef86899b-4c79-4bed-9db1-e84cd976ccdc |

Final full report: [HTML](D:/car/.cache/e2e/ef86899b-4c79-4bed-9db1-e84cd976ccdc/report/index.html), [JSON](D:/car/.cache/e2e/ef86899b-4c79-4bed-9db1-e84cd976ccdc/summary.json), [owned-service/schema cleanup](D:/car/.cache/e2e/ef86899b-4c79-4bed-9db1-e84cd976ccdc/lifecycle.json). Screenshot evidence for the customer popup/admin row list/review is retained for both devices under that run's results directory. Owned API/Next/schema/PostgreSQL processes were cleaned up and fixture password files removed. Existing unrelated work was preserved.

Post-run formatting touched only new feature source/tests, followed by successful type/source-integrity checks. The terms-heading keep-together layout adjustment was separately rendered and checked against the final normal/long PDF character bounds; it does not change the financial workflow.

An initial broad run was stopped via its verified owned Playwright child after37passes so the final run includes second-revision prefill/download verification and final request-key safeguards. Its API/Next/schema/PostgreSQL cleanup completed. It is not counted as a successful complete run.

## Operational boundaries
No production migration, customer import, personal contact delivery, payment collection or deployment. Apply the reviewed additive migration and regenerate the client before starting updated API instances. Package apps/api/assets/fonts with the runtime; Docker already copies the API directory and function build now copies the asset folder. The feature's versioned quote limit is INR2crore,20line items and2MiB per PDF. Layout is English first; unsupported glyphs return a validation error requesting transliteration instead of silently losing text. Seller/customer name/location and pricing/terms are staff-entered; no bank details or automatic tax assumptions. Contact quota is persistent, while general network-level anti-abuse/monitoring/retention remains an operational responsibility. Historical revisions remain readable after expiry, with their original validity shown.

The installed Windows Prisma engine is locked by an existing process: generation updated the client code/types but reported an engine DLL replacement error. No unrelated process was stopped. Fresh generation in .cache/quotation-generate succeeded and its engine SHA256 matches the installed engine. Successful isolated migration/API/E2E/database execution verifies current model access; a clean generation before production startup remains required.
