import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnquiryDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+15551234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'I am interested in this vehicle...' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: '2024-bmw-m4-competition' })
  @IsString()
  @IsNotEmpty()
  vehicleSlug: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false, example: 'website' })
  @IsString()
  @IsOptional()
  source?: string;
}
