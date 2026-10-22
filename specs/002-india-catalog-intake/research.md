# Research and decisions

Decision: separate module and immutable source approval with revocation; evidence references are private metadata only. Rationale: existing configurator admin code combines discovery/download/publication and public uploads. Alternative: extending arbitrary legacy JSON cannot enforce independent atomic immutable review. A read-only research agent confirmed these boundaries against the existing API and catalog/media seed17.

Decision: version1 numeric dictionary for displacement, power, dimensions, seats, range and battery. Preserve supplied value/unit/text/reference/date and normalized value/unit. Fixed conversions, six-decimal rounding, strict finite ranges, no inferred facts/prices. Alternative: AI extraction/free-form specifications deferred; neither supplies verified evidence.

Decision: serializable transactions, three attempts, unique(sourceId,importKey), canonical payload checksum, conditional final review and transactional audit. Source version is fixed1 and pinned on each candidate; no source edits. Alternatives: process-local locks fail across replicas; queue/worker unnecessary for bounded JSON work.

Decision: existing guarded PostgreSQL fixture and Jest stack, no new dependencies. No unknown library APIs require a new external integration. References are not fetched; permission records are staff attestations. No unresolved questions for this increment.
