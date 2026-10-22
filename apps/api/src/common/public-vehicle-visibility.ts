// Shared public policy: approval and availability are both necessary. Staff
// inventory reads deliberately do not use this predicate.
export const PUBLIC_VEHICLE_VISIBILITY = {
  status: 'AVAILABLE',
  publicationStatus: 'PUBLISHED',
} as const;
