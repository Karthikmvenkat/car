# Feature Specification: Quotation requests and reviewed price quotes

**Feature Branch**: `codex/005-quotation-requests`
**Created**: 2026-10-22
**Status**: Ready for implementation
**Input**: Customers request a quotation from a car page using phone/email, see a team-contact confirmation, and staff manage requests in a dedicated menu and personally contact customers. User selected priced PDF quotations after staff enters and reviews the breakdown.

## User Scenarios & Testing

### User Story 1 - Ask for a quotation (Priority: P1)
Customers select Request quotation on a published car and submit phone/email without signing in. The selected car, variant and colour accompany the request.
**Independent Test**: Submit on desktop/mobile and verify the confirmation and persisted request.
**Acceptance Scenarios**:
1. Given a published available car, when valid contact details and contact consent are submitted, then one request is stored and the popup says "Our team will contact you soon."
2. Given invalid details, unavailability, or a failed submission, when submitting, then explain the problem without a false success; retry retains the same request key.
3. Given repeated delivery of one submission, then store only one request; reject reuse of that key with different details.

### User Story 2 - Work requested quotations (Priority: P1)
Sales staff see newest-first rows in Requested quotations with reference, date, car/variant/colour, phone/email, status and actions. Staff contact customers personally and record progress.
**Independent Test**: Authorized staff find a new request and mark it contacted; unauthorized accounts cannot read or mutate it.
**Acceptance Scenarios**:
1. New requests are visible after refresh with saved car details even if inventory subsequently changes.
2. Statuses are New, Contacted and Closed; preparing an approved quotation does not falsely mark the customer contacted.
3. Concurrent staff edits cannot silently overwrite one another.

### User Story 3 - Prepare and download a price quote (Priority: P2)
Staff enter customer name/location, seller identity/address/contact, charge rows, discounts, validity, optional delivery estimate and terms. They review the complete breakdown before creating a downloadable PDF revision.
**Independent Test**: Prepare synthetic charges, review exact totals, create the PDF, parse and visually inspect it, and re-download identical bytes after a later revision.
**Acceptance Scenarios**:
1. The PDF includes a unique quote reference/revision, date, customer contact, vehicle snapshot, issuer, INR breakdown, total, validity, delivery estimate and terms.
2. Staff supply charge amounts and terms; totals are calculated by the system. No unreviewed/request-only PDF is offered as a priced quotation.
3. Negative/fractional/unsafe amounts, invalid validity, excess discounts and excessive text/rows are rejected.
4. Reviewed revisions are immutable and remain downloadable only to current active authorized staff; later revisions do not alter historical quotations.

### Edge Cases
Unpublished/deleted car; cross-car colour; double clicks and network retry; stale staff version; permission removal; request flooding; Unicode/font coverage; long names/terms and page breaks; download failure; expired validity; quote without actual availability confirmation.

## Requirements
### Functional Requirements
- **FR-001**: Collect only required phone, email, contact consent and selected vehicle context. No public prices, staff/user identities or statuses accepted.
- **FR-002**: Preserve a car/variant/colour snapshot, request reference, submission time and consent version. Public responses contain no contact echo or readable customer record.
- **FR-003**: Replayed identical submissions yield the same reference; conflicting payloads and unavailable cars fail clearly. Persistently limit contact submissions; no raw network address storage.
- **FR-004**: Restrict list/detail/status/preparation/download to active super-admin, admin and sales-manager roles. Contact details and PDFs are private and not cached publicly.
- **FR-005**: Paginate request rows, filter status, retain accessible desktop/mobile workflows, and preserve existing visual styles and unrelated workflows.
- **FR-006**: Quote money is INR, represented to exact paise, with 1-20 charge/discount rows, bounded descriptions, nonnegative amounts and a positive calculated final total. Do not infer tax rates or reuse listing currency/price as approved quote amounts.
- **FR-007**: Require explicit review confirmation and freshness/version checking before creating each immutable PDF revision. Atomically persist revision, progress version and audit. Download bytes are checksum verified.
- **FR-008**: No automatic email, payment collection, bank instructions or stock promise. Staff contact customers personally. Sample document supplies layout inspiration only; its customer, bank, prices and corporate details are not fixtures/defaults.
- **FR-009**: Extend synthetic API/database and desktop/mobile end-to-end verification. Preview minimal UI additions before implementation.

### Key Entities
- Quotation request: private contact details, immutable vehicle/colour context, status/version, request key/hash, consent and timestamps.
- Quote revision: immutable issuer/customer/pricing/terms snapshot, quote date/validity, revision number, preparing actor, PDF bytes/hash and audit linkage.
- Submission throttle: contact hash and time bucket/count, without raw phone/email/network address.

## Success Criteria
### Measurable Outcomes
- **SC-001**: A customer completes the two-contact-field request workflow within one minute in desktop/mobile checks.
- **SC-002**: All authorized staff can find new requests and download a reviewed price quote; all other tested roles are denied.
- **SC-003**: Every displayed/downloaded total matches the exact entered charge/discount arithmetic; concurrent stale actions are rejected.
- **SC-004**: Repeated identical submissions create one request and historical PDF downloads remain byte-identical.

## Assumptions
INR quotations, English-first document layout, no automated tax policy. Seller details and customer name/location are entered by staff; optional banking block is omitted from this first workflow. Existing sales permissions apply. Requests do not require an account. Staff record contact/closure manually. No production migration, real customer import or deployment is implied.
