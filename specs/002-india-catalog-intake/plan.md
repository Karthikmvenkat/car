# Implementation Plan: India catalog intake and review

**Branch**: `codex/001-production-baseline` | **Date**: 2026-10-17 | **Spec**: [spec.md](spec.md)

## Summary
Add a separate staff-only Nest module for approved source policies, immutable evidenced India candidates and final review decisions. No calls to legacy vehicle/configurator mutation or acquisition services. Preparation is synchronous bounded JSON normalization; media processing follows separately.

## Technical Context
**Language/Version**: existing TypeScript 5 / Node 24 toolchain.
**Primary Dependencies**: existing NestJS 10, Prisma 5, class-validator/class-transformer; no new packages.
**Storage**: PostgreSQL, two additive tables and enums; bounded evidence in versioned JSON.
**Testing**: Jest request-boundary authorization/validation, normalization and disposable PostgreSQL transaction tests.
**Target Platform**: existing API runtime; local Windows and Linux CI.
**Project Type**: modular web service.
**Performance Goals**: bounded 16 facts/candidate, 50 rows/page, no outbound requests or binary operations.
**Constraints**: retain UI and legacy contracts, no live migrations or actual source acquisition/approval.
**Scale/Scope**: manual pilot intake; synchronous normalization needs no second job queue.

## Constitution Check
PASS before research and after design: UI untouched; existing branch/work preserved; active server actor checked in transactions; audited atomic mutations; authorized source evidence mandatory; stack retained; additive migration applied only to owned fixture schemas. Existing legacy publication paths are not retroactively fixed by this isolated module; future public integration must consolidate them first.

## Project Structure
Documentation: this directory's spec, plan, research, data-model, quickstart, tasks, verification, contracts and quality checklist.
Source: `apps/api/src/modules/catalog-intake/` DTO, normalization helper, service, controller and module; registration in `app.module.ts`; additive models in `prisma/schema.prisma` and SQL migration; tests in `apps/api/test/` and `test/database/`.

## Implementation Strategy
Specify, quality-check, resolve design, write contract/tasks, then implement/test. Serializable mutations with three bounded attempts; source-scoped duplicate keys and canonical payload hashes. Approval is immutable policy version1; changes require a new source record. Review is one-way on immutable candidate ID/hash. Read eligibility checks current permission and freshness. No constitution exceptions.
