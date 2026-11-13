import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export const DOCS_PATH = '/docs'

/** Swagger UI at `/docs`, OpenAPI JSON at `/docs-json`. */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('nestjs-drizzle-clean-architecture')
    .setDescription('NestJS + Drizzle template: identity (JWT) and an example tasks context.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()

  SwaggerModule.setup(DOCS_PATH, app, () => SwaggerModule.createDocument(app, config))
}
