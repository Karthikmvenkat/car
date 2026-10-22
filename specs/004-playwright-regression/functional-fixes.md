# Functional regression corrections

2026-10-22, main. User authorized resolution of the six findings after the initial implementation/test commit 19b8fe4.

| Finding | Correction |
|---|---|
| E2E01 | Resolve the model within its brand and connect by real IDs; persist variant/currency, default new-car condition and INR, validate condition enum. Model changes use the same brand-scoped resolution; reject unmatched brand/model with 404. |
| E2E02 | Validate required page content as a string or object; preserve structured content serialization and reject missing/null/array/number/boolean values. Correct the authorization-only test fixture to supply required content. |
| E2E03 | Accumulate filter selections synchronously while route transitions are pending; reconcile committed/external navigation without losing newer selections. Keep the original rapid-interaction regression. |
| E2E04 | Resolve gallery and colour-photo paths with the existing asset URL helper before deduplication/display. Existing styles and image geometry remain intact. |
| E2E05 | Redirect legacy vehicle URLs to the existing query-based configurator, allowing new slugs without rebuilding a static path list. Next handles development; Firebase Hosting handles static deployment with clean URLs. |
| E2E06 | Load only role-authorized dashboard resources and show appropriate cards/actions. Exercise sales, inventory, content and analyst roles on desktop/mobile. Existing visual styles are retained. |

The original 92-file UI capture retains its hashes. Four functional corrections are explicitly fingerprinted in ui-functional-fixes.json; the other 88 source files remain unchanged. Three originally mixed/platform-newline files have additional normalized hashes so CI and Windows agree; original hashes remain recorded. This is source integrity, not screenshot-based visual equivalence.

Firebase's Windows Hosting emulator normalizes glob captures as filesystem paths and detects destination captures only when they appear after a slash. The Hosting rule therefore uses a documented named RE2 capture, retaining the old path in the harmless `from` query parameter. Clean URLs serve the exported configurator.html at /configurator. The redirect is verified separately with synthetic static pages and a demo-project emulator; no live Hosting deployment is performed. Hosting capture documentation: https://firebase.google.com/docs/hosting/full-config#capture-url-segments-for-redirects

## Verification

- Targeted six-finding suite: 16 passed, run 71f50ec0-fe8c-4be5-9fae-3a0245e8f4b2.
- Existing API suites: 428 passed, 8 suites.
- Existing real PostgreSQL suites: 31 passed, 3 suites; owned schema and server cleaned up.
- API/web/E2E typechecks passed.
- UI source integrity passed: 88 preserved files, four recorded corrections, no added frontend files.
- Firebase Hosting emulator (CLI 15.33.0): both existing/post-export slugs return 301 to the correct configurator query and load a synthetic exported HTML page with 200; /vehicles still returns 200. Final ignore rules/clean-URL settings included; emulator shut down cleanly. Probe/config retained locally in .cache/hosting-alias-test.
- Cross-platform LF checkout integrity: all 92 expected source fingerprints pass.
- Final fresh full suite: **131 passed, 0 failed, 0 skipped, 0 flaky**, retries disabled, exit 0, 7.4 minutes. Run d4ef6b97-1dca-4445-9d3e-b3904a28c09a; 19 API scenarios plus 56 desktop and 56 mobile scenarios. Owned API/Next services stopped, test schema removed, disposable PostgreSQL stopped and fixture password file removed.

Final evidence:
- [Full HTML report](D:/car/.cache/e2e/d4ef6b97-1dca-4445-9d3e-b3904a28c09a/report/index.html)
- [Full JSON report](D:/car/.cache/e2e/d4ef6b97-1dca-4445-9d3e-b3904a28c09a/summary.json)
- [Cleanup record](D:/car/.cache/e2e/d4ef6b97-1dca-4445-9d3e-b3904a28c09a/lifecycle.json)
- Lower-level results: .cache/api-test-results.json and .cache/api-database-test-results.json.

The first full correction run caught an ambiguous new heading locator: the vehicle name appears in three headings. The assertion was corrected to the h1; the actual redirect and vehicle content had loaded. A final full rerun verifies the corrected assertion without masking failures or enabling retries.

Existing external-service, payment, real-device, 3D, accessibility/performance and full production-deployment limits in coverage.md remain applicable.
