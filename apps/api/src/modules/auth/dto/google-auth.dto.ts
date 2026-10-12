import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({ example: 'google-id-token-here' })
  @IsString()
  @IsNotEmpty()
  credential: string;
}
