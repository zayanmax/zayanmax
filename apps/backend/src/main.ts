import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { setupSwagger } from './common/openapi/swagger';
import { resolveCorsOrigins } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: resolveCorsOrigins(process.env),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.SWAGGER_ENABLED === 'true'
  ) {
    setupSwagger(app);
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
