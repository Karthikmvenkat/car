/**
 * Provider-neutral description of a 3D model found by a discovery source.
 * New providers (e.g. a commercial automotive asset library) implement
 * ModelSourceProvider and are registered in ModelDiscoveryService.
 */

export interface LicenceInfo {
  /** Provider-specific licence label, e.g. "CC Attribution". */
  label: string;
  url?: string;
  requiresAttribution: boolean;
  allowsCommercialUse: boolean;
  allowsDerivatives: boolean;
  /**
   * True only for licences that clearly allow commercial use AND modification
   * (we optimise, recolour and re-serve the file). Anything else requires an
   * admin to review the licence terms before import.
   */
  autoImportAllowed: boolean;
  attributionText?: string;
}

export interface ArchiveInfo {
  sizeBytes: number;
  faceCount?: number;
  textureCount?: number;
}

export interface ModelCandidate {
  provider: string;
  externalId: string;
  name: string;
  description?: string;
  tags: string[];
  sourceUrl: string;
  thumbnailUrl?: string;
  author?: string;
  authorUrl?: string;
  licence: LicenceInfo;
  faceCount?: number;
  vertexCount?: number;
  archives: { glb?: ArchiveInfo; gltf?: ArchiveInfo };
  downloadable: boolean;
  publishedAt?: string;
  /** Set for internal-catalogue hits: the already-imported source asset. */
  internalAssetId?: string;
}

export interface VehicleQuery {
  make: string;
  model: string;
  year: number;
  generation?: string | null;
  variant?: string | null;
  market?: string | null;
  bodyStyle?: string | null;
}

export interface DownloadedModel {
  buffer: Buffer;
  format: 'glb' | 'gltf-zip';
  filename: string;
}

export interface ModelSourceProvider {
  readonly id: string;
  isConfigured(): boolean;
  /** True when the provider can download files (may need extra credentials). */
  canDownload(): boolean;
  search(query: VehicleQuery, limit: number): Promise<ModelCandidate[]>;
  download(externalId: string, maxBytes: number): Promise<DownloadedModel>;
}

/** Map Sketchfab-style licence labels to usage permissions. */
export function classifyLicence(label: string, url?: string): LicenceInfo {
  const l = label.toLowerCase();
  const isCC = l.includes('cc') || l.includes('creative commons');
  const cc0 = l.includes('cc0') || l.includes('public domain');
  const nc = l.includes('noncommercial') || l.includes('non-commercial');
  const nd = l.includes('noderivs') || l.includes('no derivatives') || l.includes('noderivatives');

  if (cc0) {
    return {
      label, url, requiresAttribution: false, allowsCommercialUse: true,
      allowsDerivatives: true, autoImportAllowed: true,
    };
  }
  if (isCC) {
    return {
      label,
      url,
      requiresAttribution: true,
      allowsCommercialUse: !nc,
      allowsDerivatives: !nd,
      autoImportAllowed: !nc && !nd,
    };
  }
  // "Free Standard", "Standard", "Editorial" and unknown licences: terms vary
  // (redistribution limits, editorial-only use), so a human must review.
  return {
    label,
    url,
    requiresAttribution: false,
    allowsCommercialUse: !l.includes('editorial'),
    allowsDerivatives: !l.includes('editorial'),
    autoImportAllowed: false,
  };
}
