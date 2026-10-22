# Data model

## CatalogSource
Immutable approved policy: id, name (1..120 trimmed characters), sourceUrl (HTTPS <=2048, no credentials/query/fragment), exact host derived from URL, license (CC0/CC_BY_4_0/MANUFACTURER_PERMISSION), evidenceRef (1..500 trimmed characters, private reference), attribution (1..1000 trimmed characters), all four permission flags true, validUntil (future timestamp), policyVersion=1, approvedById, createdAt. Revocation adds revokedAt/revokedById; never rewrites permission.

## CatalogCandidate
id; sourceId FK RESTRICT; sourcePolicyVersion=1; importKey (8..100 ASCII letters/digits/underscore/hyphen); inputHash SHA256 canonical validated payload; dictionaryVersion=1; identity JSON (market IN, condition NEW, make/model/generation/variant 1..120 trimmed chars, modelYear integer2000..2100, controlled fuel/transmission); saleEvidenceUrl (same exact approved host), saleObservedAt (not future, at most90 elapsed days old); facts JSON (1..16 unique allowed fields); submittedById; status READY_FOR_REVIEW/ACCEPTED/REJECTED; reviewedById/reviewedAt/reviewNote (1..1000 trimmed chars) nullable until final; createdAt. Unique(sourceId,importKey), index(status,id). No Vehicle link/writes or raw files/public serving.

## Fact dictionary v1
Each fact retains field, value, unit, rawText (1..500), evidenceUrl (<=2048 HTTPS same exact source host), observedAt (fresh within90 days). Store normalized value/unit too. Fields: engineDisplacementCc (cc/L ->cc, >0..10000), maxPowerKw (kW/PS/bhp ->kW, >0..2000), lengthMm/widthMm/heightMm (mm/cm/m ->mm, >0..15000), seats (count integer1..20), rangeKm (km >0..3000), batteryKwh (kWh >0..1000). Unknown facts omitted, never zeroed. Six-decimal rounding must still satisfy positive/integer constraints.

## State and history
Candidates immutable except one final review. Same decision/note is idempotent; different decision/note conflicts. Revocation is idempotent. Accepted history remains accepted after expiry/revocation, but computed eligibleForPublication becomes false; stale sale/fact evidence also removes eligibility. It is a preparation signal, not public publication. Actor IDs preserve history; AuditLog holds the transactional user relation. No DELETE routes. Rollback disables the module first; do not drop retained records merely to roll back runtime code.
