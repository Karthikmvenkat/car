# Research
Read-only research delegated to quotation_design_review as required by speckit-plan; hooks absent.
- Decision: dedicated module/tables. Rationale: enquiry source strings do not support immutable pricing/revisions; reuse SALES_ROLES/public visibility and preserve enquiries.
- Decision: snapshot vehicle/colour/contact and return public reference only. Rationale: inventory changes cannot rewrite requests; no public PII lookup.
- Decision: UUID request key/canonical hash and persistent contact-based quota. Rationale: retry-safe, multiple-instance protection; no raw IP storage. Network abuse limiting remains operational.
- Decision: immutable reviewed snapshots plus bounded PDF bytes/hash in PostgreSQL. Rationale: historical files do not change with renderer/fonts; public uploads/object storage unnecessary.
- Decision: PDFKit streaming renderer, fixed layout, wrapped/paginated text, embedded licensed font. Rationale: no production Chromium/untrusted HTML. Browser printing and runtime headless browser rejected.
- Decision: manually entered INR integer paise charges/discounts. Rationale: listing amounts/tax rates are not approved quote prices. Sample amounts and identifiers excluded.
- References: https://pdfkit.org/docs/getting_started.html and https://pdfkit.org/docs/text.html
