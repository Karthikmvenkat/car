# Playwright verification
Date2026-10-22; branch codex/001-production-baseline. Testing suite implemented and executed. Product regression remains failing; no product/UI fixes were mixed into this testing increment.

## What this feature delivers
Pinned Playwright1.64.1 and matching Chromium; guarded disposable PostgreSQL schema/seed; real API compilation, isolated Next source copy and private test storage; API integration plus desktop/mobile browser projects; failure traces/screenshots and HTML/JSON reports; least-privilege CI with seven-day synthetic artifacts. No business API mocking, production secrets or reused developer services.

Pre-implementation consistency review maps all8 requirements to8 tasks; checklist8/8 passes. Spec Kit plan/tasks/prerequisites ran successfully, no hooks (extensions.yml absent). No unresolved input blocks local testing. The suite tests real implemented contracts; it intentionally fails when they fail rather than marking known defects as expected/skip.

## Calibration corrections
The first calibration run was stopped after identifying ambiguous Next accessibility locators; only its owned Playwright child tree was terminated. The runner then stopped its own servers/dropped its schema, and the helper stopped its PostgreSQL process. Disabled option state is checked through its actual DOM property. Product alerts are scoped to main content to exclude Next's route announcer. Photo/color selectors distinguish swatches from gallery buttons.

Next dev also autoformatted tsconfig/additional generated includes. The original checkout config was restored only after matching its original integrity hash and verifying the generated include was the sole semantic difference. The harness now copies frontend source into ignored cache (excluding dotenv/node_modules/build output); generated configuration stays in that copy. All92 original frontend files passed integrity afterward.

The full run also exposed an invalid smoke-test assumption: the pipeline review route requires a vehicle ID. Its request now includes ?id=e2e-car-0. Focused desktop/mobile reruns passed with this supported input. The base route's indefinite loading without an ID remains an uncovered empty-input UX concern, not one of the six confirmed product regressions below. An additional normal filter/sort test waits for each navigation to settle and passes on both devices; the original fast successive changes still expose the race.

## Product findings under verification
| ID | Behavior | Evidence / next fix |
|---|---|---|
| E2E01 | Legacy vehicle creation returns500 for valid existing make/model | apps/api/src/modules/vehicles/vehicles.service.ts uses nonexistent model unique selector id_slug and omits requested currency; fix relation resolution and required/default fields, then verify create/update/delete separately |
| E2E02 | Page-content save returns400 for valid content | apps/api/src/modules/content/dto/upsert-page-content.dto.ts content lacks validation/allow metadata, so global forbidNonWhitelisted rejects it; define supported validated content contract |
| E2E03 | Rapid filter then sort can drop the fuel selection | apps/web/components/vehicles/VehicleFilters.tsx merges captured searchParams before navigation commits; distinguish normal awaited navigation from this fast-interaction regression |
| E2E04 | Configurator's internal relative photo URL loads from frontend origin and404s | PublicConfigurator uses raw image/color URLs while api-client supplies assetUrl helper; stored local API photo must actually decode |
| E2E05 | /vehicles/:slug rejects new real published slugs | dynamicParams=false and generateStaticParams derives only demoVehicles; /configurator?vehicle=slug works, so legacy detail alias needs a compatible routing solution |
| E2E06 | Sales-manager dashboard renders Forbidden resource | Reproduced on both devices. Dashboard aggregates inventory and sales endpoints despite role-specific permissions; design a role-aware landing view, retain server authorization |

These are regression findings, not silently repaired product code. Existing preview-only/disconnected workflows and external dependencies are separately listed in coverage.md. Hardcoded public FAQ India/single-operator wording and profile-context freshness remain code-inventory concerns; they are not claimed as E2E failures unless explicitly reproduced.

## Results

| Execution | Actual result |
|---|---|
| Complete run fc12246d-bb99-4f10-900b-472f26eb2d5e |123 executed,111 passed,12 failed,0 skipped,0 flaky;8.8min |
| API project in complete run |17 passed,2 failed |
| Desktop project in complete run |47 passed,5 failed |
| Mobile project in complete run |47 passed,5 failed |
| Focused run64e9dada-c343-43b2-b5d7-1bbb6dc98337 |4 passed: corrected pipeline inputs and added settled-navigation filtering on both devices |
| Verified unique scenarios across these executions |125 checked;115 passed,10 failing cases across6 product issues;0 skipped |
| Existing API suites |428/428 passed,8 suites |
| Existing real PostgreSQL suites |31/31 passed,3 suites |
| API,web,E2E typechecks |Passed |
| UI integrity |92/92 original files unchanged,no frontend additions |
| JS/PowerShell syntax,workflow YAML,whitespace |Passed |
| Missing fixture URL |Runner rejected absent CAR_TEST_DATABASE_URL despite dummy DATABASE_URL;no fallback |
| Lifecycle |Owned servers stopped,schemas removed,portable PG processes stopped,password files removed |

The unique-scenario count combines full-run evidence with the two corrected pipeline cases and two added settled-navigation cases. It is **not** a new single full125-case run. Original reports remain unchanged and retain their original counts. A green four-case focused report does not make full regression green. Current source collects125 cases; a fresh full run is still required after product fixes.

Reports:
- [Full HTML report](D:/car/.cache/e2e/fc12246d-bb99-4f10-900b-472f26eb2d5e/report/index.html)
- [Full raw JSON](D:/car/.cache/e2e/fc12246d-bb99-4f10-900b-472f26eb2d5e/summary.json)
- [Focused HTML report](D:/car/.cache/e2e/64e9dada-c343-43b2-b5d7-1bbb6dc98337/report/index.html)
- [Combined evidence index](D:/car/.cache/e2e/verified-outcomes.json)
- [Focused lifecycle evidence](D:/car/.cache/e2e/64e9dada-c343-43b2-b5d7-1bbb6dc98337/lifecycle.json)

Both full-run and focused pointers are retained separately under .cache/e2e. Failure screenshot/trace/error-context files are retained in each run's results folder. The full run exited1 as intended; the focused correction run exited0. Lower-level results remain in .cache/api-test-results.json and .cache/api-database-test-results.json. The collector under ignored cache indexes these specific executions without changing their reports.

## Remaining prerequisites and limits
No further user input or production credentials were required for local regression: browser/runtime, synthetic data, disposable database, private fixture storage and server lifecycle are automated. npm run test:e2e requires an explicitly configured localhost test database; the Windows helper can provision one from the existing trusted portable PostgreSQL runtime. Browser download and npm dependencies are prerequisites on a fresh machine.

Production-like static export, Firefox/WebKit, GPU/real licensed3D assets, external model/AI providers, actual OAuth/email delivery, payment/refund sandbox and durable cloud storage/backup/restore remain separately scoped. These checks do not constitute a production-readiness, performance, accessibility or compliance certification. See coverage.md for explicit feature boundaries.

The frontend source/design and product APIs/schema are unchanged by this testing increment. Previous implementation work and independent workspace changes (including an existing Puppeteer dependency, unused by this suite) were preserved. CI configuration was parsed locally and pins verified action references; no push/GitHub run/deployment occurred. npm install used ignore-scripts and only Playwright is required by these tests. Legacy lint debt remains outside this increment and was not rerun.

Next action: fix the six confirmed product issues, rerun their targeted regressions, then run the entire125-case suite against fresh fixtures. Keep public reviewed-media publication and real money collection gated separately.
