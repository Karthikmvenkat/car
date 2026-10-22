# Research

Decision: retain current modules/Prisma and explicit existing roles. Rationale: close observed customer escalation/PII access without a new policy service or UI. Alternatives: global role-default rewriting (could break public routes), external IdP/session migration (follow-up), microservices (unjustified).

Decision: real HTTP requests with NestFactory, signed JWTs and fake persistence. Existing Jest/ts-jest suffice; no new Node dependency. Avoid full AppModule, production env loading, workers, provider APIs and live database. Synthetic transaction tests verify algorithm/options/retries, not PostgreSQL concurrency.

Decision: serializable interactive user-change transaction with bounded P2034 retry, actor revalidation and audit. An unlocked count/update permits last-admin loss. Self-lockout rejected. Existing toggle-status contract retained but documented as non-idempotent.

Read-only research agent independently confirmed role groups and current-account/fail-closed requirements. Official Spec Kit 1.2.1 installed in task-owned tooling, initialized .specify and Codex .agents/skills through the CLI; no global Python/runtime dependency changes. Current spec/plan content is authored by this agent following installed templates/scripts, not produced by a separate remote command runner.
