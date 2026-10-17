export type PaintFinish = 'solid' | 'metallic' | 'pearl' | 'matte';

export interface PaintRenderingParameters {
  /** sRGB hex used for rendering — kept separate from the official name/paint code. */
  baseColor: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  /** Subtle pearlescent shift (MeshPhysicalMaterial.iridescence). */
  iridescence?: number;
  sheen?: number;
}

const FINISH_DEFAULTS: Record<PaintFinish, Omit<PaintRenderingParameters, 'baseColor'>> = {
  solid: { metalness: 0.05, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.06 },
  metallic: { metalness: 0.65, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.03 },
  pearl: { metalness: 0.45, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 0.25 },
  matte: { metalness: 0.35, roughness: 0.68, clearcoat: 0, clearcoatRoughness: 0.6 },
};

export const PAINT_FINISHES = Object.keys(FINISH_DEFAULTS) as PaintFinish[];

export function isHexColour(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function buildRenderingParameters(hex: string, finish: string): PaintRenderingParameters {
  const f = (PAINT_FINISHES as string[]).includes(finish) ? (finish as PaintFinish) : 'metallic';
  const params: PaintRenderingParameters = { baseColor: hex.toLowerCase(), ...FINISH_DEFAULTS[f] };
  // Very dark metallics read as flat black without a little extra roughness spread.
  const lum = luminance(hex);
  if (lum < 0.04 && f !== 'matte') params.roughness = Math.max(params.roughness, 0.25);
  return params;
}

/**
 * Generic starting hex values so an admin isn't typing hex for "White".
 * These are rendering approximations only — the official colour name and
 * manufacturer paint code are entered separately and the colour stays
 * UNVERIFIED until an admin confirms it against manufacturer data.
 */
export const GENERIC_COLOUR_HEX: Record<string, string> = {
  white: '#f2f2ef', pearl: '#efeee8', black: '#0d0e10', silver: '#b9bcbf', grey: '#6b6e71', gray: '#6b6e71',
  red: '#a3121b', blue: '#1d3d7a', green: '#2f4a35', olive: '#5b5e45', brown: '#4d3527', beige: '#c8b89a',
  orange: '#c9581d', yellow: '#d9b21c', gold: '#a88a52', bronze: '#7a5a3a', maroon: '#5a1218', graphite: '#3a3c3f',
};

export function suggestHex(name: string): string | null {
  const n = name.toLowerCase();
  for (const [key, hex] of Object.entries(GENERIC_COLOUR_HEX)) if (n.includes(key)) return hex;
  return null;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
