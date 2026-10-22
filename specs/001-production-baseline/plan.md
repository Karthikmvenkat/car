# Implementation Plan: Secure Production Baseline

Branch: codex/001-production-baseline. Date: 2026-10-17. Spec: spec.md.

## Summary
Implement the bounded backend security foundation: explicit route roles, current active identity, no demo fallback, validated and atomic super-admin changes, safe public vehicle visibility and ignored unverified user association. Preserve frontend and response shapes. No migration or production external action.

## Technical Context
Existing TypeScript/NestJS 10/Passport JWT/Prisma 5/PostgreSQL; Jest and ts-jest already installed. Node built-in fetch drives HTTP integration tests without adding supertest or Nest testing dependencies. Fake persistence prevents external access. Existing API/web type checks pass before changes. Shared controller/module/strategy controls apply to both Nest and Firebase entry points.

## Constitution Check
Pass: existing stack/UI/current work preserved, explicit server authority, isolated security tests, no live payment/import/deployment. No schema change. Last-admin algorithm uses serializable transaction/retry; actual PostgreSQL race proof remains a release gate, not claimed by mocks. No unresolved technical choice blocks this feature. Spec quality checklist reviewed complete; no extension hooks configured.

## Project Structure
apps/api/src/common: role groups and fail-closed role guard.
apps/api/src/modules/auth: signing configuration, database-only auth and current-account JWT validation.
apps/api/src/modules/{users,vehicles,brands,content,enquiries,bookings}: explicit role metadata, validated user/lead status bodies, trusted identity handling and public filters.
apps/api/test: real HTTP request/guard/validation suite plus invariant/service tests with synthetic persistence.
specs/001-production-baseline: spec, plan, research, data model, contracts, quickstart, tasks and verification.

## Design and Rollout
Use a current-user lookup for each protected JWT; preserve request.user.sub/role. No session/logout revocation claim. Require safe production JWT secret; ephemeral development key when absent, never a known secret. Remove demo stores entirely; failed DB auth returns sanitized 503 and subsequent requests can recover. Use roles guard at every legacy protected method/class. Role/status changes revalidate actor inside serializable transaction, guard last active super-admin/self-lockout, write audit and retry only P2034 conflicts. Public submissions keep compatibility userId field but never associate it without verified identity. Public vehicle queries require AVAILABLE and PUBLISHED; limit max 50. Generic unexpected errors expose no raw exception text.

## Validation
Test policy matrix over actual controllers and real signed tokens, status/role changes, outage/recovery, config failure, invalid DTOs, public visibility, spoofed user associations and transaction retry invariants. Run API Jest, API/web no-emit type checks, web lint and API build; record failures honestly. Hash all frontend files against historical baseline; no visual capture needed to establish source unchanged, but runtime screenshot baseline remains future work. No real DB connection or migrations.

## Follow-up
MFA, server sessions/logout, CORS/rate controls, assigned-sales ownership, readiness/backups and UI baseline screenshots remain later gates. Catalog engine and paid-request features stay deferred. Roll back code artifact only in isolated environment; do not deploy insecure baseline as a production recovery strategy.
