# CarPal Constitution

## Core Principles

### I. Preserve product and current work
Retain Next.js/NestJS/PostgreSQL/Prisma and the existing customer/admin UI design. Implement in a codex branch; preserve unrelated tracked/untracked work. Minimal booking/copy/status additions require a preview before implementation. No broad rewrite or speculative infrastructure.

### II. Server authority and fail-closed security
Privileged operations require explicit server authorization and a current active identity. Do not trust browser roles, account identifiers, prices or payment state. Never fall back to demo authentication or known production signing secrets. No secrets/customer data in artifacts, logs or fixtures.

### III. Evidence-driven verification
Test meaningful security/business invariants with isolated fixtures and request boundaries. Record actual results and limitations; mocked persistence is not live database verification. No production data, payment, deployment or destructive action without appropriate authorization.

### IV. Reliable lawful catalog and commerce
Single operator; new cars currently sold in India. Permitted source material is internally stored, automatically prepared, reviewed and published by staff. Paid model/variant requests do not guarantee stock. Version amounts/terms; require idempotency, signed events, reconciliation and refunds before live collection. Full refund before confirmation/on unavailability/deadline miss; two-business-day confirmation requires an agreed calendar.

### V. Incremental compatible delivery
Retain safe route/response contracts; deny formerly unauthorized behavior. Prefer existing dependencies. Migrations must be reviewed/additive/recoverable. Keep requirements, tasks, implementation and verification traceable. Commercial decisions do not block unrelated security work.

## Delivery Constraints
Razorpay-first evaluation uses a replaceable adapter. No real payment keys, merchant setup, source acquisition or collection in foundation work. Marketplace tenancy, physical-stock allocation and final vehicle sale are separate scope. Preserve independent enquiries/test drives and synthetic verification data.

## Development Workflow and Quality Gates
Use Spec Kit constitution, bounded specification, clarification where necessary, plan/research/contracts, tasks, consistency analysis, implementation and convergence. Run relevant API/security tests and backend/frontend checks. Backend-only changes must preserve frontend hashes. Record operational/legal/payment gates honestly.

## Governance
User decisions govern workflow defaults. Amendments document rationale and semantic version change; review implementation against these principles and record evidence-backed exceptions. Implementation authorized 2026-10-17; cloud deployment and collection of real funds are not authorized by this baseline feature. Templates consume this constitution at runtime and are not rewritten by this amendment.

**Version**: 1.0.0 | **Ratified**: 2026-10-17 | **Last Amended**: 2026-10-17
