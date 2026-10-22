# Staff media contract
JWT plus current inventory roles (SUPER_ADMIN/ADMIN/INVENTORY_MANAGER) required on every `/api/catalog-media` route. Mutation actor checked in DB transaction; no client actor/storage keys accepted.

| Method | Route | Contract |
|---|---|---|
| POST | /candidates/:candidateId/images | multipart one image plus sourceId,importKey,evidenceUrl,evidenceRef,creator,attribution,alt,acquiredAt; returns private pending media metadata |
| GET | /candidates/:candidateId/images | optional limit1..50 default20/cursor; private metadata items,nextCursor |
| GET | /images/:id | private metadata with dynamic eligibility |
| GET | /images/:id/derivatives/:variant | preview or thumbnail only; bounded verified WebP bytes; blocked after source revocation/expiry or withdrawal; no-store/nosniff |
| POST | /images/:id/review | decision ACCEPTED/REJECTED,note1..1000,identityConfirmed actual boolean; acceptance requires true and eligible catalog facts |
| POST | /images/:id/withdraw | no payload; audited idempotent withdrawal |

Multipart at most1 file8MiB,8 fields2048bytes each,9 parts,headerPairs50. DTO rejects unknown fields, invalid dates/URLs/keys. Original filenames/MIME never select decoder or storage paths. Preview metadata accepted/rejected/pending is staff-only; originals have no route.

POST201/GET200. Errors400 invalid image/metadata,401/403 auth,404 missing object,409 stale/revoked permission/conflicting key/final review/withdrawal eligibility,413 input bytes excessive,429 two upload slots occupied,503 persistence/storage/decoder infrastructure unavailable. Hard decoder deadline rejected400; no raw worker errors. Headers are Cache-Control private,no-store;Content-Type image/webp;X-Content-Type-Options nosniff. No network acquisition/public URLs.

Audit actions catalog.media.prepare/review/withdraw, IDs/hash/decision only. No provenance text or original filenames in audit/logs. Complete private blob sets may outlive failed commits; reconcile against CatalogMedia.storageKey conservatively before production, never delete a possibly active writer's files.
