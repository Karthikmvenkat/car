# Decisions
Use Playwright real browser+HTTP contexts with isolated PostgreSQL, not a mocked storefront. Official [configuration](https://playwright.dev/docs/test-configuration), [API testing](https://playwright.dev/docs/api-testing), [browsers](https://playwright.dev/docs/browsers) checked2026-10-22. Playwright dependency pinned; matching Chromium downloaded into ignored cache.

Reuse PostgreSQL helper/guard and fresh schema. API compiled separately; Next dev uses unique build directory because existing next.config.js production output is static export. This proves local functional integration, not production export/deployment. No existing server reuse or .env credential fallback for data/external services.

Coverage distinguishes workflows from route smoke. New API-only modules get real HTTP integration. Existing disabled editors/disconnected reset/mailto flows remain explicitly limited. Specialist dashboard authorization and profile context freshness are known risk candidates to investigate/report, not silently skip. WebGL fidelity, OAuth/provider acquisition and payments need separate prerequisites.
