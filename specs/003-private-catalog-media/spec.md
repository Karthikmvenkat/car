# Feature Specification: Private catalog image preparation

**Feature Branch**: `codex/001-production-baseline`
**Created**: 2026-10-17
**Status**: Implemented and locally verified; production storage/publication gates remain
**Input**: Continue the approved India catalog/media roadmap without changing existing UI.

## User Scenarios & Testing
### User Story 1 - Prepare authorized photos (Priority: P1)
Inventory staff upload a manually acquired authorized photo for an immutable India candidate, recording its creator, attribution, permission evidence, source reference and acquisition date. The original stays private and smaller review images are prepared automatically.
**Independent Test**: Upload a synthetic photo and verify original checksum, two bounded derivatives, provenance and one audit event. Retry identical content without duplicates.
**Acceptance Scenarios**:
1. Given an active approved image source and existing candidate, when staff uploads a supported photo with complete evidence, then a pending private media record and derivatives are created.
2. Given unsupported, corrupt, animated or oversized input, when uploaded, then no successful media record is created.
3. Given an existing upload key, when identical bytes/metadata are retried, then the original record is returned; different content conflicts.

### User Story 2 - Review exact identity (Priority: P2)
Staff view private derivatives and accept/reject a photo, explicitly confirming exact candidate variant identity before acceptance. Acceptance does not publish.
**Independent Test**: Compete final reviews; preserve exactly one decision and audit. Revoke permission and verify previews and current eligibility are blocked.
**Acceptance Scenarios**:
1. Given a pending photo, accepted fresh catalog candidate and current image permission, when staff confirms exact variant identity and accepts, then the final review is retained.
2. Given expired/revoked image permission or stale/unaccepted candidate, when acceptance is attempted, then it is blocked; rejection remains possible.
3. Given anonymous/non-inventory users, when metadata or derivatives are requested, then access is denied. Original/proof bytes have no download route.

### Edge Cases
Duplicate concurrent uploads, conflicting final reviews, decoder timeout/crash, resource saturation, source withdrawal during processing, audit failure, missing/tampered blobs and invalid storage configuration must fail safely. Files must not be removed merely because a database commit response was lost.

## Requirements
- **FR-001**: Only active administrators/inventory managers may upload, read, review or withdraw; revalidate actors inside mutations. No frontend/public listing changes.
- **FR-002**: Tie each photo to an existing immutable candidate and approved source policy version; retain creator, attribution, permission reference, acquisition time, original hash and transformation lineage.
- **FR-003**: Support only static JPEG/PNG/WebP, at most8MiB,16million pixels and8192 pixels per edge. Reject corrupt/animated/unsupported data independently of filename/MIME claims. Bound processing duration/concurrency and reject excess work without an unbounded queue.
- **FR-004**: Preserve the original privately and create orientation-corrected sRGB WebP previews fitting1600x1600 and400x400 without enlargement/cropping. Strip embedded metadata from derivatives while retaining rights records separately; do not alter color/equipment or remove watermarks.
- **FR-005**: Keep binary storage outside public/static roots. Use server-generated immutable keys, verify integrity on read, and expose only authenticated derivatives with no-store caching.
- **FR-006**: Deduplicate identical keyed uploads and reject conflicting reuse. Successful records/reviews/withdrawals require transactional audit. Retain complete private files on ambiguous persistence failures for reconciliation; never expose partial files.
- **FR-007**: Final acceptance requires exact variant confirmation, current source rights and accepted/fresh catalog facts. Revocation/expiry/withdrawal removes current eligibility without rewriting final history. Withdrawal blocks derivative delivery.
- **FR-008**: Verify resource/file/authorization boundaries and actual persistence/concurrency/audit behavior using synthetic images and owned disposable database fixtures.

### Key Entities
Private media: candidate/source-policy relationship, original and derivative checksums/dimensions, provenance, keyed request checksum, pending/final review and withdrawal actors/times.

## Success Criteria
- **SC-001**: Every accepted photo retains complete evidence, verified dimensions/hashes, exact-variant attestation and reviewer history.
- **SC-002**: Concurrent identical uploads create one record; competing decisions create one final audit.
- **SC-003**: Invalid images produce no successful record, and no anonymous caller can obtain private media bytes.
- **SC-004**: Permission withdrawal prevents subsequent derivative access; all92 existing frontend files remain unchanged.

## Assumptions
Staff uploads only; no source acquisition/scraping, remote URLs fetched, generated vehicle imagery, cloud deployment, public publication or booking changes. Private local filesystem adapter is for development and a single persistent API instance; shared object storage and deployment hardening remain gates before production use. Crash orphan reconciliation is documented conservatively without automatic deletion. Actual source permissions require human review, not automated legal conclusions.
