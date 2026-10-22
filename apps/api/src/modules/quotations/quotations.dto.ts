import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
const raw = ({ obj, key }: { obj: Record<string, unknown>; key: string }) =>
  obj[key];
const trim = ({ obj, key }: { obj: Record<string, unknown>; key: string }) =>
  typeof obj[key] === 'string' ? (obj[key] as string).trim() : obj[key];
export class CreateQuotationDto {
  @Transform(raw) @IsUUID('4') requestKey!: string;
  @Transform(trim) @IsString() @Length(1, 150) vehicleSlug!: string;
  @IsOptional() @Transform(raw) @IsString() @Length(1, 100) colourId?: string;
  @Transform(trim)
  @IsString()
  @Matches(/^(?:\+91[ -]?)?[6-9]\d{9}$/)
  phone!: string;
  @Transform(trim) @IsEmail() @Length(3, 254) email!: string;
  @Transform(raw) @IsBoolean() @Equals(true) consent!: boolean;
}
export class QuotationPageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 20;
  @IsOptional() @IsIn(['NEW', 'CONTACTED', 'CLOSED']) status?:
    'NEW' | 'CONTACTED' | 'CLOSED';
}
export class QuotationVersionDto {
  @Transform(raw) @IsInt() @Min(0) @Max(2000000000) expectedVersion!: number;
}
export class QuotationStatusDto extends QuotationVersionDto {
  @IsIn(['NEW', 'CONTACTED', 'CLOSED']) status!: 'NEW' | 'CONTACTED' | 'CLOSED';
}
export class QuotationItemDto {
  @Transform(trim) @IsString() @Length(1, 100) label!: string;
  @IsOptional() @Transform(trim) @IsString() @Length(0, 300) note?: string;
  @IsIn(['CHARGE', 'DISCOUNT']) kind!: 'CHARGE' | 'DISCOUNT';
  @Transform(raw) @IsInt() @Min(0) @Max(2000000000) amountPaise!: number;
}
export class CreateQuotationRevisionDto extends QuotationVersionDto {
  @Transform(raw) @IsBoolean() @Equals(true) reviewed!: boolean;
  @Transform(trim) @IsString() @Length(1, 120) customerName!: string;
  @Transform(trim) @IsString() @Length(1, 300) customerLocation!: string;
  @Transform(trim) @IsString() @Length(1, 150) issuerName!: string;
  @Transform(trim) @IsString() @Length(1, 500) issuerAddress!: string;
  @Transform(trim) @IsString() @Length(1, 150) issuerContact!: string;
  @Transform(raw)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  validUntil!: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 120)
  deliveryEstimate?: string;
  @Transform(trim) @IsString() @Length(1, 3000) terms!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items!: QuotationItemDto[];
}
