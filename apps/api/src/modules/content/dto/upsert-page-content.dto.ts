import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertPageContentDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  content: string | Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
