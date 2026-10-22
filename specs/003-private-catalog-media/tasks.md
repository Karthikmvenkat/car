# Tasks: Private catalog media
Inputs: spec,plan,research,data-model and contracts/media.md. Meaningful tests required by FR008.

## Setup and foundation
- [x] T001 Record consistency/rights/storage boundaries in specs/003-private-catalog-media/verification.md; checklist16/16.
- [x] T002 Add CatalogMedia and RESTRICT source/candidate relationships with unique(candidateId,importKey) in prisma/schema.prisma and prisma/migrations/20261017010000_catalog_media/migration.sql; declare Sharp0.35.5 in apps/api/package.json and package-lock.json.

## US1 prepare photos
Independent test: synthetic image yields original checksum and two bounded private derivatives; invalid files rejected.
- [x] T003 [US1] Add decoder/storage/resource tests in apps/api/test/catalog-media-processing.spec.ts and request authorization/multipart tests in apps/api/test/catalog-media.http.spec.ts.
- [x] T004 [US1] Implement bounded decoder and private storage in apps/api/src/modules/catalog-media/;8MiB/16Mp/8192edge/two leases/15s deadline; WebP1600/400, immutable random keys, no public root/symlinks.
- [x] T005 [US1] Implement provenance DTO and keyed upload service in apps/api/src/modules/catalog-media/; key8..100,evidenceRef1..500,creator1..200,attribution1..1000,alt1..300,HTTPS exact-host reference<=2048,nonfuture ISO acquisition; recheck active actor/source and atomic audit; retain uncertain private orphans.

## US2 review and withdraw
Independent test: one concurrent final review; revoked/withdrawn previews blocked.
- [x] T006 [US2] Add actual persistence/concurrency/audit/revocation tests in apps/api/test/database/catalog-media.postgres.spec.ts.
- [x] T007 [US2] Implement private metadata/verified derivative routes, final review note1..1000 plus exact identity attestation and withdrawal in apps/api/src/modules/catalog-media/; lists1..50/default20; register module in apps/api/src/app.module.ts.

## Verification
- [x] T008 Run all relevant tests/typechecks/build/UI integrity and fixture cleanup; record evidence and operational limits in specs/003-private-catalog-media/verification.md.

Dependencies:T001->T002->US1->US2->T008. T003 processing/HTTP tests are independent files after contracts; execution remains sequential here. US1 delivers private preparation MVP; US2 completes staff review. No public publisher or production object store is included.
