# Authorization and Compatibility Contract

Inventory/brands/configurator administration: SUPER_ADMIN, ADMIN, INVENTORY_MANAGER. Lead/test-drive management: SUPER_ADMIN, ADMIN, SALES_MANAGER. CMS/SEO/testimonial/FAQ writes: SUPER_ADMIN, ADMIN, CONTENT_EDITOR. User read: SUPER_ADMIN, ADMIN. Role/status mutation: SUPER_ADMIN. ANALYST has no raw PII entitlement. Missing role metadata on role-guarded handlers fails closed.

Guest protected call 401; active unauthorized role 403; disabled/missing account 401; identity store unavailable 503; invalid enum/body 400; last-super-admin conflict 409. Unexpected errors are generic, not Prisma/connection details. JWT role is replaced with persisted current role and active account status is required.

Existing paths and successful shapes remain. Public reads and guest enquiry/test-drive creation remain public; client-provided userId is accepted for compatibility but ignored. Existing public vehicle search/detail require AVAILABLE and PUBLISHED; published=false does not bypass public visibility. Staff uses guarded /vehicles/all. Pagination limit is 1–50. No payment endpoint or frontend change in this feature.
