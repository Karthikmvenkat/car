export const STAFF_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'INVENTORY_MANAGER',
  'SALES_MANAGER',
  'CONTENT_EDITOR',
  'ANALYST',
] as const;

/** Roles allowed to manage the 3D configurator pipeline (mirrors the API guard). */
export const CONFIGURATOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'] as const;

export function isStaffRole(role?: string | null) {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export function canManageConfigurator(role?: string | null) {
  return !!role && (CONFIGURATOR_ROLES as readonly string[]).includes(role);
}

export function canManageSales(role?: string | null) {
  return !!role && ['SUPER_ADMIN','ADMIN','SALES_MANAGER'].includes(role);
}
