import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000002',
    description: 'Session ID returned by login. Optional for legacy clients.',
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiProperty({ example: 'refresh.jwt.token' })
  @IsString()
  refreshToken!: string;
}
