# Playwright regression plan
2026-10-22, codex/001-production-baseline. Spec: [spec.md](spec.md).
## Technical context
Node24/TypeScript, pinned Playwright1.64.1, matching Chromium, real NestJS/Next dev server and PostgreSQL17. Reuse database guard/schema ownership and portable PG helper. No product/UI/schema change. Browser matrix desktop Chromium and Pixel7 emulation; API integration project separately identified. Optional cross-engine testing remains a separate command/environment, not a passing claim.
## Architecture
scripts/run-e2e.cjs owns random schema, synthetic seed, ephemeral ports, sanitized child environments, API compilation into ignored cache, Next isolated source copy/build directory, Playwright invocation and finally cleanup. Copy excludes dotenv/build/output directories; Next's automatic TypeScript config updates therefore stay outside the checkout. Existing portable DB helper gains Suite=e2e option; CI supplies ephemeral postgres. Tests cannot run against arbitrary URLs or live DB. Browser traffic restricted to loopback; asset worker disabled. No business API mocks.
## Constitution check
PASS pre/post-design: UI/work preserved, no real accounts/data/sources/payments, explicit localhost guard, owned process cleanup, least-privilege CI and honest results. Failures may reveal existing defects; no unsolicited UI fixes or weakened assertions.
## Structure
playwright.config.ts; e2e/support fixtures/data; browser workflow, route smoke and API spec files; scripts/run-e2e.cjs + scripts/lib/e2e-seed.cjs; isolated workflow; coverage/verification docs here. Existing unit/DB regression suites remain independent.
## Research
Read-only research agent inventories actual app: favorites localStorage, compare client-state, profile/API persistence, real leads/test drives; catalog/media API-only. Content/settings saves disabled, forgot-password disconnected, contact/sell mailto; no false delivery tests. Research incorporated in research.md. Official Playwright configuration/API-testing/browser-install docs verified.
