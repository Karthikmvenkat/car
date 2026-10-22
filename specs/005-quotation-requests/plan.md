# Implementation Plan: Quotation requests
**Branch**: codex/005-quotation-requests | **Date**: 2026-10-22 | **Spec**: spec.md

## Summary
Dedicated quotations module alongside enquiries. Persist public requests with server-resolved car snapshots; authorize sales staff for paginated processing and versioned status/review actions. Generate a priced PDF only after explicit review, storing immutable bytes and snapshot. Customer two-field dialog, confirmation, dedicated admin table and preparation/review reuse existing styling.

## Technical Context
TypeScript, NestJS10, Next14/React18, Prisma5/PostgreSQL. PDFKit0.20.2 and embedded open font; no production Chromium. Exact integer paise, maximum20rows, PDF<=2MiB, staff page<=50rows. Jest/disposable PostgreSQL and desktop/mobile Playwright. Authenticated fetch download, never bearer query strings.

## Constitution Check
Pre/post design PASS: codex branch; unrelated work preserved; preview shown before UI implementation. Original UI capture retained with explicit feature additions/corrections. Current server permissions, sample PII/banking details excluded. Additive migration only; no production migration/deployment/payment/automatic delivery/stock promise. Synthetic tests. No unresolved clarification.

## Project Structure
apps/api/src/modules/quotations/ (DTOs/service/controller/module/pricing/PDF), prisma/schema.prisma and migrations/20261022000000_quotation_requests, apps/web/components/vehicles/QuotationRequest.tsx, apps/web/app/admin/quotations/page.tsx, existing configurator/navigation, API/database/E2E tests and apps/api/assets/fonts.

## Delivery
Contracts -> schema/privacy -> public request -> staff rows/status -> reviewed PDF revisions -> verification/rendering. Full existing131case suite remains required alongside new scenarios. Staff enter seller and customer name/location fields per quote. No automatic financial identifiers or tax rates.
