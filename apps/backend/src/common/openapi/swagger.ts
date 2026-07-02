import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const standardSuccessSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    message: {
      type: 'string',
      example: 'Request completed successfully',
    },
    data: { type: 'object', nullable: true },
  },
};

export const standardErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string', example: 'Validation failed' },
    errorCode: { type: 'string', example: 'VALIDATION_ERROR' },
    details: { type: 'object', nullable: true },
  },
};

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Zayan Max Backend API')
    .setDescription(
      'Modular internal office management backend. All runtime API routes use /api/v1. Responses are wrapped in the standard success/error envelope.',
    )
    .setVersion(process.env.BUILD_VERSION ?? '0.0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the access token returned by /api/v1/auth/login.',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
    deepScanRoutes: true,
  });

  document.components = document.components ?? {};
  document.components.schemas = {
    ...(document.components.schemas ?? {}),
    StandardSuccessResponse: standardSuccessSchema,
    StandardErrorResponse: standardErrorSchema,
  };

  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: '/api/docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
