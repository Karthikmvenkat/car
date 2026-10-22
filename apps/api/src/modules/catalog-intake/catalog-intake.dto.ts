import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, Equals, IsArray, IsBoolean, IsIn, IsInt, IsISO8601, IsNumber, IsObject, IsOptional, IsString, Length, Matches, Max, Min, ValidateNested } from 'class-validator';

const trim = ({ obj, key }: { obj: Record<string, unknown>; key: string }) => typeof obj[key] === 'string' ? (obj[key] as string).trim() : obj[key];
const original = ({ obj, key }: { obj: Record<string, unknown>; key: string }) => obj[key];
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
export class CreateCatalogSourceDto {
  @Transform(trim) @IsString() @Length(1, 120) name!: string;
  @IsString() @Length(1, 2048) sourceUrl!: string;
  @IsIn(['CC0', 'CC_BY_4_0', 'MANUFACTURER_PERMISSION']) license!: 'CC0' | 'CC_BY_4_0' | 'MANUFACTURER_PERMISSION';
  @Transform(trim) @IsString() @Length(1, 500) evidenceRef!: string;
  @Transform(trim) @IsString() @Length(1, 1000) attribution!: string;
  @Transform(original) @IsBoolean() @Equals(true) commercialUse!: boolean;
  @Transform(original) @IsBoolean() @Equals(true) storageAllowed!: boolean;
  @Transform(original) @IsBoolean() @Equals(true) displayAllowed!: boolean;
  @Transform(original) @IsBoolean() @Equals(true) modificationAllowed!: boolean;
  @Matches(timestamp) @IsISO8601({ strict: true }) validUntil!: string;
}

export class CatalogIdentityDto {
  @Equals('IN') market!: string;
  @Equals('NEW') condition!: string;
  @Transform(trim) @IsString() @Length(1, 120) make!: string;
  @Transform(trim) @IsString() @Length(1, 120) model!: string;
  @Transform(trim) @IsString() @Length(1, 120) generation!: string;
  @Transform(original) @IsInt() @Min(2000) @Max(2100) modelYear!: number;
  @Transform(trim) @IsString() @Length(1, 120) variant!: string;
  @IsIn(['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID', 'PLUG_IN_HYBRID']) fuel!: string;
  @IsIn(['MANUAL', 'AUTOMATIC', 'AMT', 'CVT', 'DCT', 'SINGLE_SPEED']) transmission!: string;
}

export class CatalogFactDto {
  @IsIn(['engineDisplacementCc', 'maxPowerKw', 'lengthMm', 'widthMm', 'heightMm', 'seats', 'rangeKm', 'batteryKwh']) field!: string;
  @Transform(original) @IsNumber({ allowNaN: false, allowInfinity: false }) value!: number;
  @IsString() @Length(1, 16) unit!: string;
  @Transform(trim) @IsString() @Length(1, 500) rawText!: string;
  @IsString() @Length(1, 2048) evidenceUrl!: string;
  @Matches(timestamp) @IsISO8601({ strict: true }) observedAt!: string;
}

export class PrepareCatalogCandidateDto {
  @IsString() @Length(1, 100) sourceId!: string;
  @IsString() @Matches(/^[A-Za-z0-9_-]{8,100}$/) importKey!: string;
  @IsObject() @ValidateNested() @Type(() => CatalogIdentityDto) identity!: CatalogIdentityDto;
  @IsString() @Length(1, 2048) saleEvidenceUrl!: string;
  @Matches(timestamp) @IsISO8601({ strict: true }) saleObservedAt!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(16) @ValidateNested({ each: true }) @Type(() => CatalogFactDto) facts!: CatalogFactDto[];
}

export class ReviewCatalogCandidateDto {
  @IsIn(['ACCEPTED', 'REJECTED']) decision!: 'ACCEPTED' | 'REJECTED';
  @Transform(trim) @IsString() @Length(1, 1000) note!: string;
}

export class CatalogPageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 20;
  @IsOptional() @IsString() @Length(1, 100) cursor?: string;
}
