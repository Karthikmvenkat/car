// Explicit permissions for the current single-operator roles. Public routes do
// not use RolesGuard; attaching it without role metadata must fail closed.
export const INVENTORY_ROLES = ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'];
export const SALES_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'];
export const CONTENT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_EDITOR'];
export const USER_READ_ROLES = ['SUPER_ADMIN', 'ADMIN'];
