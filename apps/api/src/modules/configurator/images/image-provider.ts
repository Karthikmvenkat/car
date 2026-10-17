export interface ImageGenerationRequest {
  prompt: string;
  /** Reference / base images. When present, providers use an edit/variation endpoint. */
  referenceImages?: Array<{ buffer: Buffer; mimeType: string; filename: string }>;
  size?: '1024x1024' | '1536x1024' | '1024x1536';
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
  model: string;
  revisedPrompt?: string;
  estimatedUsd: number;
}

/** Adapter so the image provider can be swapped without touching the pipeline. */
export interface ImageProvider {
  readonly id: string;
  isConfigured(): boolean;
  generate(req: ImageGenerationRequest): Promise<GeneratedImage>;
}

export const IMAGE_PROVIDER = Symbol('IMAGE_PROVIDER');
