import 'reflect-metadata';
import { Type, plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @IsInt()
  @Min(1)
  @Type(() => Number)
  PORT = 4000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRES_IN = '15m';

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRES_IN = '30d';

  @IsOptional()
  @IsString()
  STORAGE_PROVIDER?: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  SWAGGER_ENABLED?: 'true' | 'false';
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  if (validatedConfig.NODE_ENV === 'production') {
    assertProductionSecret(
      'JWT_ACCESS_SECRET',
      validatedConfig.JWT_ACCESS_SECRET,
    );
    assertProductionSecret(
      'JWT_REFRESH_SECRET',
      validatedConfig.JWT_REFRESH_SECRET,
    );
    if (
      validatedConfig.JWT_ACCESS_SECRET === validatedConfig.JWT_REFRESH_SECRET
    ) {
      throw new Error('JWT access and refresh secrets must be different');
    }
  }

  return validatedConfig;
}

function assertProductionSecret(name: string, value: string) {
  if (value.length < 32) {
    throw new Error(`${name} must be at least 32 characters in production`);
  }

  const normalized = value.toLowerCase();
  if (
    normalized.includes('change_me') ||
    normalized.includes('changeme') ||
    normalized.includes('zayanmax-secret')
  ) {
    throw new Error(`${name} uses a known development placeholder`);
  }
}
