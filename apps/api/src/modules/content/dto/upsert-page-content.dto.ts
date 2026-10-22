import { IsString, IsOptional, IsObject, ValidateBy } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertPageContentDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @ValidateBy({ name: 'pageContent', validator: {
    validate: value => typeof value === 'string' || (value !== null && typeof value === 'object' && !Array.isArray(value)),
    defaultMessage: () => 'content must be a string or an object',
  } })
  content: string | Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
