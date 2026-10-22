# Data Model

No schema migration. Existing User(id, role, status), Vehicle(status, publicationStatus), AuditLog(userId,action,entity,entityId,metadata) are used. JWT subject identifies the persisted current account; its role claim is not authoritative. Failed identity reads cannot create an authenticated actor.

Role/status changes transactionally preserve at least one ACTIVE SUPER_ADMIN, revalidate the acting super administrator, and append a redacted audit event. Serializable retry restarts the complete read/check/write transaction. Guest enquiry/test-drive userId remains unset regardless of legacy caller field. Session logout revocation is not implemented without a later session/version model.
