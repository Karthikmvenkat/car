# Feature Specification: India catalog intake and review

**Feature Branch**: `codex/001-production-baseline`
**Created**: 2026-10-17
**Status**: Ready for implementation
**Input**: Continue the approved single-operator India catalog roadmap without changing the existing UI.

## User Scenarios & Testing

### User Story 1 - Register an authorized source (Priority: P1)
An administrator records an explicitly approved commercial source, its permission evidence, attribution, permitted transformations and expiry. Inventory staff can inspect sources but cannot approve them.
**Independent Test**: Register a synthetic approved source; verify role restrictions, expiry validation and atomic audit history.
**Acceptance Scenarios**:
1. Given an active administrator and complete rights evidence, when a source is registered, then it becomes available for staff intake with its approving actor recorded.
2. Given expired permission or missing storage/display/modification permission, when registration is attempted, then it is rejected.
3. Given a source, when an administrator revokes it, then further intake and acceptance are blocked.

### User Story 2 - Prepare an evidenced India candidate (Priority: P1)
Inventory staff submit manually acquired, authorized new-car facts and receive a normalized candidate for review. The original values and evidence remain available to staff.
**Independent Test**: Submit a synthetic India variant with power/dimension evidence; retry it and verify a single unchanged candidate and audit event.
**Acceptance Scenarios**:
1. Given a valid approved source, when a complete India identity, recent current-sale evidence and supported facts are submitted, then normalized values and original evidence are retained in an immutable candidate.
2. Given an earlier import key, when identical content is retried, then the original result is returned; different content with that key is rejected.
3. Given unsupported units, duplicate facts, a different source host, a future or older-than-90-day observation, or a revoked source, when intake is attempted, then no candidate is created.

### User Story 3 - Review without exposing drafts (Priority: P2)
Inventory staff explicitly accept or reject a candidate, retaining the reviewer, time and reason. Acceptance prepares a future publication workflow; it does not make a listing public.
**Independent Test**: Compete accepting/rejecting the same candidate; exactly one final decision and audit event survive.
**Acceptance Scenarios**:
1. Given a pending candidate and current permission, when staff accepts it, then the decision is recorded once.
2. Given revoked/expired permission or stale current-sale evidence, when acceptance is attempted, then it is blocked; rejection remains possible.
3. Given anonymous callers or customers, when source/candidate records are requested, then access is denied.

### Edge Cases
Concurrent import retries and reviews, failing audit storage, inactive/demoted actors, whitespace-only evidence, malformed source references, unsupported licensing categories, pagination boundaries and unavailable persistence must fail safely. Missing values remain unknown rather than becoming zero.

## Requirements
### Functional Requirements
- **FR-001**: Only active administrators may register/revoke sources; active administrators and inventory managers may read, import and review.
- **FR-002**: Record a supported permission category (CC0, CC BY 4.0 or explicit manufacturer permission), evidence reference, attribution, commercial/display/storage/modification permission and expiry. Registration is an explicit staff attestation, not legal verification.
- **FR-003**: Restrict candidates to new cars in India with make, model, generation, model year, variant, fuel and transmission, plus evidence that the car is currently sold, observed within 90 days.
- **FR-004**: Retain original facts, their source references and observation time, alongside normalized values from a versioned dictionary; reject unsupported or contradictory duplicate facts.
- **FR-005**: Retry identical keyed submissions without duplicates; reject conflicting reuse. Candidates and final reviews are immutable.
- **FR-006**: Revalidate permission and freshness at acceptance; record each successful mutation and its actor atomically. Concurrent decisions must not overwrite each other.
- **FR-007**: Keep sources, proofs and candidates staff-only, with bounded lists of at most 50 records. Existing listings and public workflows remain unchanged.
- **FR-008**: Verify meaningful authorization, normalization, concurrency, persistence and audit rollback invariants using synthetic and isolated database fixtures.

### Key Entities
- **Catalog source**: approved origin, permission evidence, license category, attribution, expiry, approval/revocation actors.
- **Catalog candidate**: immutable India identity and facts, source, import key and checksum, pending/final decision, reviewer and reason.

## Success Criteria
### Measurable Outcomes
- **SC-001**: Every accepted candidate has a complete India identity, fresh sale evidence, active permission and recorded review actor.
- **SC-002**: Concurrent identical intake creates exactly one candidate; concurrent conflicting decisions produce exactly one final review.
- **SC-003**: Failed audit recording leaves no successful business mutation.
- **SC-004**: No candidate appears in public listings, and all 92 existing frontend files remain unchanged.

## Assumptions
This is the first catalog increment, delivered through staff APIs. Staff manually obtains authorized facts; no arbitrary URL fetching, source connector, image download/decoding, object storage, public publication, legacy listing migration or payment changes are included. Media-byte processing and public adapters follow in separate specifications. Manufacturer portal availability alone is insufficient permission. No actual source is approved or imported by this implementation.
