# Feature Specification: Secure Production Baseline

**Feature Branch**: `codex/001-production-baseline`
**Created**: 2026-10-17
**Status**: Implemented and locally verified; production release gates recorded in verification.md
**Input**: Begin baseline and security foundations, preserving UI/current work. Catalog engine and paid booking follow in later bounded features.

## User Scenarios & Testing

### User Story 1 — Only permitted staff can administer the platform (Priority: P1)
As an operator, I need customer logins unable to read staff records or change inventory, content, users, roles, leads or appointments.

**Independent Test**: Direct guest/customer and staff requests exercise every legacy privileged method against synthetic persistence.

**Acceptance Scenarios**:
1. Customer/guest attempts any staff operation: denied regardless of browser state.
2. Inventory manager edits vehicles/brands: allowed; changes user roles: denied.
3. Sales manager reads/updates enquiries/test drives: allowed; edits content/roles: denied.
4. Super administrator changes another user's role/status: validated/audited; removing the last active super administrator or self-lockout: rejected.

### User Story 2 — Identity remains safe during failures and account changes (Priority: P1)
As an operator, database failures must deny authentication; suspension/demotion must affect the next protected request.

**Independent Test**: Synthetic account/database failures, inactive accounts and stale role claims without access to live records.

**Acceptance Scenarios**:
1. Failed identity store during login/register/validation: unavailable, no demo identity/token.
2. Suspended/deleted account uses an old token: denied.
3. Old administrator token belongs to now-customer: staff access denied using current permissions.
4. Missing/unsafe production signing configuration: startup fails without exposing secret values.

### User Story 3 — Existing customer journeys remain compatible (Priority: P2)
Customers can browse published offers and submit enquiries/test-drive requests through the existing UI, without forged account association.

**Independent Test**: Public contract/forged identity scenarios through isolated application fixtures.

**Acceptance Scenarios**:
1. Public slug/list controls never reveal unpublished/unavailable vehicles.
2. Public request with another user's identifier makes no account association from that unverified field.
3. Backend-only implementation leaves frontend source/configuration hashes unchanged.

### Edge Cases
Concurrent changes to different super administrators; invalid role/status input; store outage/recovery; deleted account; Google login for inactive user; draft detail lookup; huge list limit. Session logout revocation and assigned-sales ownership remain follow-up scope, not claimed as fixed here.

## Requirements

### Functional Requirements
- **FR-001**: Explicit role policies protect every legacy privileged method; role-guarded methods without metadata deny access.
- **FR-002**: Current active identity/role governs protected calls; token signature/expiry remains verified.
- **FR-003**: Authentication never falls back to demo/memory identities; outages fail safely and can recover on later calls.
- **FR-004**: Production signing configuration is mandatory and rejects known example/short values without disclosure.
- **FR-005**: Role/status changes validate input, prevent self-lockout/last-active-super-admin loss under concurrency and atomically audit.
- **FR-006**: Public submissions ignore unverified caller account identifiers; legacy vehicle reads enforce publication/availability and bounded pagination.
- **FR-007**: Safe response contracts/frontend files remain unchanged; no migration, payment, import or deployment.
- **FR-008**: Isolated request tests and deterministic checks record actual evidence and production limitations.

### Key Entities
Existing User/role/status, authenticated actor, public offer, enquiry/test-drive request and restricted audit event. No new persisted entity required.

## Success Criteria
- **SC-001**: Every legacy privileged method has guest/customer denial and allowed/disallowed staff test coverage.
- **SC-002**: All tested suspended/deleted/stale-role/outage cases issue no unauthorized success/token.
- **SC-003**: Concurrent administrator changes preserve an active super administrator or fail/retry safely.
- **SC-004**: Frontend hashes match baseline; backend/frontend type checks pass.
- **SC-005**: Each requirement maps to implementation/verification tasks; no unrun/live-data claim.

## Assumptions and Dependencies
Least privilege uses existing roles: inventory=ADMIN/SUPER_ADMIN/INVENTORY_MANAGER; sales=ADMIN/SUPER_ADMIN/SALES_MANAGER; content=ADMIN/SUPER_ADMIN/CONTENT_EDITOR; user reads=ADMIN/SUPER_ADMIN; role/status mutations=SUPER_ADMIN. Assigned-lead ownership, MFA, server sessions/logout revocation, abuse controls and commerce are future specifications. No commercial clarification blocks this slice.
