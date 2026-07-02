import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      service: 'zayan-max-backend',
      status: 'ok',
    };
  }
}
