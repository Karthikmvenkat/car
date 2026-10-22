# Functional coverage matrix
2026-10-22. This is a feature/route inventory, not a claim of exhaustive correctness or line coverage. Results in verification.md and Playwright artifacts.

| Area | Tests | Scope / remaining limits |
|---|---|---|
| Browse/search/filter/sort | customer.browser, legacy.api | Actual published inventory and draft/reserved exclusions; browser filter reads existing query contract |
| Favorites | customer.browser | Add/remove/reload in same localStorage context; no cross-account sync implemented |
| Compare | customer.browser |3slots and duplicate exclusion; client state only |
| Configurator photos/colors/specs/features/save/share | customer.browser + legacy.api | Local synthetic photo and persisted configuration; no licensed real GLB/WebGL visual fidelity/provider acquisition certified |
| Auth | customer/staff.browser + legacy.api | Email registration/login/invalid login/session/logout/current role; Google sign-in external not exercised |
| Profile | customer.browser + legacy.api | Name/phone persistence; context freshness risk documented separately |
| Enquiry/test drive | customer.browser | Real form ->DB ->staff status update; test drives are not paid bookings |
| Finance | customer.browser | Deterministic EMI and invalid budget; no lender integration |
| Staff login/records/screens | staff/routes.browser | Staff login, access denial, read/status surfaces; generic brand/user/FAQ/testimonial screens are not CRUD forms |
| Brands/models/legacy vehicles | legacy.api | Real CRUD and permissions; no legacy automatic photo lookup or external acquisition |
| Content | legacy.api + route smoke | FAQ/testimonial CRUD, page-content and SEO HTTP round-trips; public FAQ hardcoded, editors/settings preview-only; valid page-content request currently fails |
| User roles/status | legacy.api | Persisted promotion/demotion/suspension/current-token effects and self-lockout guard; concurrency remains lower-level DB suites |
| Source/candidate preparation | catalog-media.api | Approval permission, field normalization, keyed replay/conflict, review and revocation |
| Private image engine | catalog-media.api | Real multipart decode/storage/derivative/review/withdrawal; lower-level decoder/path/concurrency cases remain existing459tests |
| All public static routes | routes.browser | Navigation, heading, page error/overflow; route smoke does not prove every action |
| Contact/sell | route smoke | Mailto draft UI only; no actual email delivery tested |
| Password reset | customer.browser | Verifies truthful disconnected state; no reset delivery implemented |
| Admin content/settings | route smoke | Explicit preview-only screens; save disabled, no persistence claim |
| Payments/deposits/refunds | None | Future implementation, no real/sandbox payment collection |
| Public reviewed catalog/media publisher | None | Future work; current preparation flags are not publication |
| Production object storage, backup/restore, deployment | None | Separate infrastructure gates; local fixtures only |
| Pipeline external/model/AI jobs | None | Worker disabled to prevent acquisition/provider calls; existing API guard/unit coverage remains, not pipeline E2E |

The pipeline review screen itself is smoke-tested with its required ?id=e2e-car-0. Base route without an ID remains an empty-input UX gap. Filter/sort is tested both as rapid successive changes (failing regression) and normal navigation-settled changes (passing). Private media decoding runs actual Sharp/child/storage code; browser configurator image loading is separately checked and currently fails for relative internal URLs.

Smoke inventory: public /,/vehicles,/vehicles/e2e-aster,/about,/how-it-works,/faq,/contact,/sell,/finance,/stories,/get-started,/terms,/privacy,/signin,/register,/forgot-password,/favorites,/compare,/enquire,/test-drive. Protected /profile and /admin/login tested in workflows. Staff routes /admin,/admin/vehicles,/admin/vehicles/new,/admin/vehicles/pipeline,/admin/3d-library,/admin/enquiries,/admin/bookings,/admin/users,/admin/customers,/admin/brands,/admin/faqs,/admin/testimonials,/admin/content,/admin/settings. Configurator query and empty state tested. Deeper pipeline interactions remain excluded. Separate photo-decoding assertion checks actual browser image loading; a rendered img tag alone does not pass it.

Known inventory concerns to verify before launch: public FAQ United States/marketplace wording conflicts with approved India/single-operator scope; profile save does not update AuthContext until reload; specialist dashboard combines inventory+sales requests and may show403. No frontend source changes are included in this testing feature.
