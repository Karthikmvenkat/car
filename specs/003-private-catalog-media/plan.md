# Implementation plan: Private catalog media
Branch `codex/001-production-baseline`; date2026-10-17; [spec](spec.md).

## Summary
Staff-only multipart image preparation, isolated decoder, private local storage adapter and immutable audited media review. No downloads, UI changes or public publisher.

## Technical context
TypeScript/NestJS/Prisma/PostgreSQL and Node24 as installed. Sharp0.35.5 already exists transitively; declare it explicitly for the API. Multer supplied by Nest platform-express. JPEG/PNG/staticWebP8MiB/16Mp/8192 edge; two per-process upload leases before multipart buffering, no waiting queue. Parent kills decoder child after15s; Sharp concurrency1/cache disabled, heap128MiB,5s native timeout per derivative. Native RSS is not a hard sandbox; deployment OS memory limits remain required. Derivatives WebP1600/400 square bounds without cropping/enlargement. Store under required absolute CATALOG_MEDIA_ROOT separate from every known public root; no default enabled storage. The configured mount must be persistent and single-instance; shared cloud storage deferred.

## Constitution check
PASS pre/post-design: existing UI/legacy APIs preserved; server actor/source checks inside serializable transaction; synthetic tests and additive fixture-only migrations; explicit provenance; no real sources/deployment/payment. Private filesystem is deliberately gated by explicit configuration; not a production object-store deployment. No speculative queue.

## Structure
`apps/api/src/modules/catalog-media/`: DTO/controller/module/service, decoder worker string/parent processor, storage adapter and upload lease interceptor. Add module to app.module.ts. Add CatalogMedia table and source/candidate relations. Tests under apps/api/test and test/database. Artifacts in this feature folder.

## Delivery and consistency
Sources may differ from the candidate fact source. Source approval covers storage/display/modification; every asset adds private evidence, creator and attribution. Candidate immutable ID ties image identity to facts; review requires exact-variant confirmation and currently eligible catalog facts. Complete immutable blob set is persisted before the DB/audit commit. Ambiguous commit leaves files private; never delete on persistence failure. Duplicate concurrent attempts may leave unreferenced blob sets. No automatic orphan deletion; report-only reconciliation/retention/backup is a deployment gate. Withdrawals/revocation block subsequent preview requests; already delivered bytes cannot be recalled.
