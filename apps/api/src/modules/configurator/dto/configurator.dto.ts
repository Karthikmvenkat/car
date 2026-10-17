import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional,
  IsString, IsUrl, Matches, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { MATERIAL_CATEGORIES, MaterialCategory } from '../gltf/material-classifier';
import { PAINT_FINISHES } from '../colours/colour-presets';
import { PIPELINE_STAGES } from '../pipeline/stages';

export class ColourInputDto {
  @ApiPropertyOptional() @IsOptional() @IsUrl({ protocols: ['https'], require_protocol: true }) @MaxLength(1000)
  imageUrl?: string;
  @ApiProperty({ example: 'Glacier White Pearl' })
  @IsString() @IsNotEmpty() @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'SWP' })
  @IsOptional() @IsString() @MaxLength(30)
  manufacturerPaintCode?: string;

  @ApiProperty({ example: '#f2f2ef', description: 'Rendering colour (not the official colour)' })
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'previewHex must be a #rrggbb colour' })
  previewHex: string;

  @ApiPropertyOptional({ enum: PAINT_FINISHES })
  @IsOptional() @IsIn(PAINT_FINISHES)
  finish?: string;

  @ApiPropertyOptional({ enum: ['AVAILABLE', 'DISCONTINUED', 'UNVERIFIED'] })
  @IsOptional() @IsIn(['AVAILABLE', 'DISCONTINUED', 'UNVERIFIED'])
  availabilityStatus?: 'AVAILABLE' | 'DISCONTINUED' | 'UNVERIFIED';
}

export class CreateConfiguratorVehicleDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  photoMode?: boolean;
  @ApiProperty({ example: 'Kia' }) @IsString() @IsNotEmpty() @MaxLength(60)
  make: string;

  @ApiProperty({ example: 'Seltos' }) @IsString() @IsNotEmpty() @MaxLength(60)
  model: string;

  @ApiProperty({ example: 2025 }) @Type(() => Number) @IsInt() @Min(1950) @Max(2100)
  year: number;

  @ApiPropertyOptional({ example: 'SP2 facelift' }) @IsOptional() @IsString() @MaxLength(80)
  generation?: string;

  @ApiPropertyOptional({ example: 'India' }) @IsOptional() @IsString() @MaxLength(60)
  market?: string;

  @ApiProperty({ example: 'HTX Plus' }) @IsString() @IsNotEmpty() @MaxLength(80)
  variant: string;

  @ApiProperty({ example: 'SUV' }) @IsString() @IsNotEmpty() @MaxLength(40)
  bodyType: string;

  @ApiProperty({ example: 'Petrol' }) @IsString() @IsNotEmpty() @MaxLength(40)
  fuelType: string;

  @ApiProperty({ example: 'Automatic' }) @IsString() @IsNotEmpty() @MaxLength(40)
  transmission: string;

  @ApiPropertyOptional({ example: 'FWD' }) @IsOptional() @IsString() @MaxLength(40)
  drivetrain?: string;

  @ApiProperty({ type: [ColourInputDto] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(24) @ValidateNested({ each: true }) @Type(() => ColourInputDto)
  colours: ColourInputDto[];

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  interiorOptions?: string[];

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  wheelOptions?: string[];

  @ApiPropertyOptional({ example: 1899000, description: 'Ex-showroom price in whole currency units' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'INR' }) @IsOptional() @IsString() @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Admin confirms the price against the manufacturer price list' })
  @IsOptional() @IsBoolean()
  priceVerified?: boolean;

  @ApiPropertyOptional({ description: 'Free-form spec sheet, e.g. { engine: "1.5L", powerPs: 115 }' })
  @IsOptional() @IsObject()
  specifications?: Record<string, string | number | boolean>;

  @ApiPropertyOptional() @IsOptional() @IsUrl({ protocols: ['https', 'http'], require_protocol: true }) @MaxLength(500)
  manufacturerUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ default: true, description: 'Start the asset pipeline immediately' })
  @IsOptional() @IsBoolean()
  generateAssets?: boolean;
}

export class UpdateConfiguratorVehicleDto {
  @IsOptional() @IsString() @MaxLength(80) generation?: string;
  @IsOptional() @IsString() @MaxLength(60) market?: string;
  @IsOptional() @IsString() @MaxLength(80) variant?: string;
  @IsOptional() @IsString() @MaxLength(40) bodyType?: string;
  @IsOptional() @IsString() @MaxLength(40) fuelType?: string;
  @IsOptional() @IsString() @MaxLength(40) transmission?: string;
  @IsOptional() @IsString() @MaxLength(40) drivetrain?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) interiorOptions?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) wheelOptions?: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) price?: number;
  @IsOptional() @IsBoolean() priceVerified?: boolean;
  @IsOptional() @IsObject() specifications?: Record<string, string | number | boolean>;
  @IsOptional() @IsUrl({ require_protocol: true }) manufacturerUrl?: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
}

export class ReplaceColoursDto {
  @ApiProperty({ type: [ColourInputDto] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(24) @ValidateNested({ each: true }) @Type(() => ColourInputDto)
  colours: ColourInputDto[];
}

export class StartJobDto {
  @ApiPropertyOptional({ enum: PIPELINE_STAGES })
  @IsOptional() @IsIn(PIPELINE_STAGES as unknown as string[])
  fromStage?: (typeof PIPELINE_STAGES)[number];
}

export class ModelUploadDto {
  @ApiProperty({ example: 'Licensed from Kia India dealer kit' }) @IsString() @IsNotEmpty() @MaxLength(200)
  licenceLabel: string;

  @IsOptional() @IsString() @MaxLength(500) licenceUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) sourceUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) attributionText?: string;
  @IsOptional() @IsString() @MaxLength(120) author?: string;

  @ApiPropertyOptional({ description: '"true" when the uploader asserts this is the exact make/model/year/generation' })
  @IsOptional() @IsIn(['true', 'false'])
  claimsExactMatch?: 'true' | 'false';
}

export class ImportCandidateDto {
  @ApiPropertyOptional({ description: 'Required for licences that are not auto-import safe (NC/ND/Standard/Editorial)' })
  @IsOptional() @IsBoolean()
  licenceAcknowledged?: boolean;
}

export class MaterialMappingUpdateItem {
  @IsString() @IsNotEmpty() name: string;
  @IsIn(MATERIAL_CATEGORIES) category: MaterialCategory;
}

export class UpdateMaterialMappingsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => MaterialMappingUpdateItem)
  materials: MaterialMappingUpdateItem[];

  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()
  resumePipeline?: boolean;
}

export class IdentityDecisionDto {
  @ApiProperty({ enum: ['VERIFIED_EXACT', 'APPROVED_APPROXIMATE', 'REJECTED'] })
  @IsIn(['VERIFIED_EXACT', 'APPROVED_APPROXIMATE', 'REJECTED'])
  status: 'VERIFIED_EXACT' | 'APPROVED_APPROXIMATE' | 'REJECTED';

  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class RenderUploadDto {
  @ApiProperty({ example: 'view:front-three-quarter' })
  @Matches(/^(view:[a-z-]+|colour:.{1,80}|thumbnail)$/)
  label: string;

  @IsString() @IsNotEmpty() webAssetId: string;
}

export class ReviewDecisionDto {
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class SaveConfigurationDto {
  @IsString() @IsNotEmpty() vehicleSlug: string;
  @IsOptional() @IsString() @MaxLength(80) selectedVariant?: string;
  @IsOptional() @IsString() @MaxLength(80) selectedColour?: string;
  @IsOptional() @IsObject() selectedOptions?: Record<string, string>;
  @IsOptional() @IsObject() cameraState?: Record<string, number[] | number>;
}
