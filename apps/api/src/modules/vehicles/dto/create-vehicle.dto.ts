import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { VehicleCondition } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class VehicleImageInput {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alt?: string;
}

export class CreateVehicleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  brandSlug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  modelSlug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  variant: string;

  @ApiProperty()
  @IsInt()
  year: number;

  @ApiProperty()
  @IsInt()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  mileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transmission?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  drivetrain?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyStyle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exteriorColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interiorColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(VehicleCondition)
  condition?: VehicleCondition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: [VehicleImageInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleImageInput)
  images?: VehicleImageInput[];
}
