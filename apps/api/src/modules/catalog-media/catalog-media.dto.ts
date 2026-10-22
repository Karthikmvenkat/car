import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
const trim = ({ obj, key }: { obj: Record<string, unknown>; key: string }) => typeof obj[key] === 'string' ? (obj[key] as string).trim() : obj[key];
const original = ({ obj, key }: { obj: Record<string, unknown>; key: string }) => obj[key];

export class UploadCatalogMediaDto {
  @IsString() @Length(1, 100) sourceId!: string;
  @IsString() @Matches(/^[A-Za-z0-9_-]{8,100}$/) importKey!: string;
  @IsString() @Length(1, 2048) evidenceUrl!: string;
  @Transform(trim) @IsString() @Length(1, 500) evidenceRef!: string;
  @Transform(trim) @IsString() @Length(1, 200) creator!: string;
  @Transform(trim) @IsString() @Length(1, 1000) attribution!: string;
  @Transform(trim) @IsString() @Length(1, 300) alt!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/) @IsISO8601({ strict: true }) acquiredAt!: string;
}
export class ReviewCatalogMediaDto {
  @IsIn(['ACCEPTED','REJECTED']) decision!: 'ACCEPTED' | 'REJECTED';
  @Transform(trim) @IsString() @Length(1, 1000) note!: string;
  @Transform(original) @IsBoolean() identityConfirmed!: boolean;
}
export class MediaPageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 20;
  @IsOptional() @IsString() @Length(1, 100) cursor?: string;
}
