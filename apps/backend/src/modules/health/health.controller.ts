import {
  Controller,
  Get,
  HttpCode,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(200)
  summary() {
    return this.healthService.summary();
  }

  @Get('live')
  @HttpCode(200)
  liveness() {
    return this.healthService.liveness();
  }

  @Get('ready')
  async readiness() {
    const readiness = await this.healthService.readiness();
    if (readiness.status !== 'ok') {
      throw new ServiceUnavailableException(readiness);
    }
    return readiness;
  }
}
