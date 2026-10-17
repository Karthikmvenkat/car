export const PREVIEW_ANGLES = [
  { key: 'front-three-quarter', label: 'Front three-quarter', camera: 'front three-quarter view from the front-left corner, camera at headlight height, about 35 degrees off the centre line' },
  { key: 'front', label: 'Front', camera: 'straight-on front view, camera centred at headlight height' },
  { key: 'rear', label: 'Rear', camera: 'straight-on rear view, camera centred at tail-light height' },
  { key: 'left', label: 'Left side', camera: 'pure left-side profile, camera perpendicular to the car at door-handle height' },
  { key: 'right', label: 'Right side', camera: 'pure right-side profile, camera perpendicular to the car at door-handle height' },
  { key: 'top', label: 'Top', camera: 'top-down view from directly above, car pointing up the frame' },
] as const;

export type PreviewAngleKey = (typeof PREVIEW_ANGLES)[number]['key'];

export interface PromptVehicle {
  make: string;
  model: string;
  year: number;
  variant?: string | null;
  generation?: string | null;
  market?: string | null;
  bodyStyle?: string | null;
}

const STUDIO =
  'Photographed in a seamless light-grey studio cyclorama with a soft overhead key light, gentle rim lights, ' +
  'a subtle floor reflection and soft contact shadow. 50 mm lens equivalent, no perspective distortion.';

const CONSTRAINTS =
  'Reproduce the real production vehicle faithfully: correct body shape, grille, headlight and tail-light signatures, ' +
  'wheel design, badges and trim for this exact model year and market. Do not invent styling, add body kits, change ' +
  'the wheels or modify the grille. No people, no text overlays, no watermarks, no number-plate text, no other vehicles.';

export function describeVehicle(v: PromptVehicle): string {
  const parts = [String(v.year), v.make, v.model, v.variant || ''].filter(Boolean).join(' ');
  const extras = [v.generation ? `${v.generation}` : '', v.market ? `${v.market}-market` : '', v.bodyStyle || '']
    .filter(Boolean)
    .join(', ');
  return extras ? `${parts} (${extras})` : parts;
}

export function buildAnglePrompt(v: PromptVehicle, angle: (typeof PREVIEW_ANGLES)[number], colour: string, hasReferences: boolean): string {
  return [
    `Photorealistic automotive studio photograph of a ${describeVehicle(v)} painted ${colour}.`,
    `Camera: ${angle.camera}. The whole vehicle is in frame with even margins.`,
    STUDIO,
    CONSTRAINTS,
    hasReferences
      ? 'Match the supplied reference photos for the vehicle design; only change the camera angle, lighting and background as described.'
      : '',
  ].filter(Boolean).join(' ');
}

export function buildRecolourPrompt(v: PromptVehicle, colourName: string, hex: string, finish: string): string {
  return [
    `Repaint only the painted body panels of this ${describeVehicle(v)} to ${colourName} (${finish} finish, approximately ${hex}).`,
    'Keep everything else pixel-identical: camera angle, framing, background, lighting, reflections layout, glass, tyres, wheels, ' +
      'lights, chrome, black plastic trim, badges and grille must not change.',
    'No text, no watermark.',
  ].join(' ');
}
