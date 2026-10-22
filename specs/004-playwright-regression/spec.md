# Specification: Playwright functional regression
Created2026-10-22. Branch codex/001-production-baseline. Input: test old and new implemented functionality end to end, explain prerequisites, preserve UI.

## User scenarios
### US1 customer journeys (P1)
Run real browsers against isolated services to verify discovery/search/filter/detail, favorites/compare, email registration/login/profile, enquiry and test-drive submission. Independently verify submitted records through authenticated staff APIs. Desktop and mobile contexts must work without changing the design.
Acceptance: published synthetic cars visible, drafts absent; saved favorites persist in the same browser; configuration sharing round-trips; valid forms persist, invalid login is rejected; protected pages redirect anonymous users.

### US2 staff and new API workflows (P1)
Verify staff login/list/status screens, role boundaries, existing CRUD APIs, source/candidate intake/review/revocation and private media upload/derivatives/review/withdrawal. New API-only features are labeled integration tests, not nonexistent UI workflows.
Acceptance: correct persisted state, rights/role denials, keyed retries and private derivative boundaries; no real sources or funds involved.

### US3 trustworthy repeatable results (P1)
A clean run provisions its own schema/data, services, files and reports. Failed checks remain visible; a matrix records preview-only, incomplete, external and untested behavior.
Acceptance: cleanup on success/failure; no live database fallback; no reused existing services; reports distinguish failure/skipped/coverage gaps. Source/UI unchanged.

## Requirements
- FR001: Guard all fixture databases to explicitly configured localhost test databases; use a fresh owned schema, never reset an existing database.
- FR002: Seed synthetic users for every role, published/draft vehicles, local media and content; keep tests independently named and deterministic.
- FR003: Exercise customer browser journeys on desktop/mobile with actual API/database persistence, no mocked business API responses.
- FR004: Exercise implemented legacy and new staff HTTP workflows plus current-role authorization; label API-only coverage honestly.
- FR005: Produce failure screenshots/traces and machine/human reports; fail on unexpected assertions rather than hiding failures with retries or skips.
- FR006: Inventory every web route and feature boundary, distinguishing route smoke, workflow, API, external and unfinished coverage.
- FR007: Start/stop only owned test services, use private storage, block browser outbound traffic and disable external asset workers/provider credentials.
- FR008: Provide local/CI commands, prerequisites and actual verification evidence. Do not change frontend source or deployment configuration.

## Success criteria
- SC001: Every implemented area has explicit evidence or a documented coverage gap; no claim that navigation verifies all functionality.
- SC002: Same command runs against clean synthetic data without production credentials.
- SC003: Reported pass/fail counts match retained artifacts;92-file frontend integrity remains unchanged.

## Edge cases and assumptions
Startup/port/browsers/DB failures must cleanup. Tests may uncover product defects; report them explicitly rather than weakening assertions. Real OAuth, email delivery, external model sourcing, GPU3D fidelity, payment/refund and production object storage require separate environments and are not locally certified. Static preview routes are only smoke-tested. No production deployment or real payments are authorized.
