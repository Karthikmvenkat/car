# Staff catalog intake contract

Prefix `/api/catalog-intake`; all routes JWT protected with current roles. Active SUPER_ADMIN/ADMIN may register/revoke; those roles plus INVENTORY_MANAGER may read/intake/review. Mutations revalidate actor in transaction. No network fetching of references.

| Method | Path | Request / response |
|---|---|---|
| POST | /sources | name, sourceUrl, license, evidenceRef, attribution, commercialUse/storageAllowed/displayAllowed/modificationAllowed all true, validUntil; returns source |
| GET | /sources | optional limit1..50 default20, cursor<=100; items,nextCursor |
| POST | /sources/:id/revoke | empty body; returns source with revocation actor/time |
| POST | /candidates | sourceId, importKey, identity, saleEvidenceUrl, saleObservedAt, facts; returns normalized candidate and current eligibility |
| GET | /candidates | bounded cursor pagination; items,nextCursor and current eligibility |
| GET | /candidates/:id | staff detail including original/normalized facts and review |
| POST | /candidates/:id/review | decision ACCEPTED/REJECTED, note1..1000; returns final candidate |

Constraints: [data-model.md](../data-model.md). Unknown properties rejected at every nesting level. Strings trimmed before hashing; ISO8601 timestamps; intake numbers/booleans require actual JSON types. References require HTTPS with no credentials/query/fragment and are never redirect/download instructions. Existing1MiB parser limit retained; semantic bounds limit retained fields.

Errors:400 malformed/unsupported input,401 unauthenticated/inactive,403 insufficient current role,404 missing source/candidate,409 expired/revoked source or stale evidence or changed keyed payload/conflicting review/exhausted serialization retries,503 unavailable persistence/audit. Unexpected internals sanitized. POST201 including replay; GET200. Cursor order ID descending.

Audit actions: catalog.source.approve/revoke, catalog.candidate.prepare/review. Metadata contains IDs/hash/version/decision, never evidence text. Audit failure rolls back mutation. No legacy/UI/payment contracts change.
