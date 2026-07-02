import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty({ example: 'Password456', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'admin@zayan.test' })
  @IsEmail()
  email!: string;
}

export class PasswordResetConfirmDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'reset-token-from-out-of-band-channel' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'Password456', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @ApiPropertyOptional({
    description: 'Optional reset token record ID for future delivery flows.',
  })
  @IsOptional()
  @IsUUID()
  resetTokenId?: string;
}
