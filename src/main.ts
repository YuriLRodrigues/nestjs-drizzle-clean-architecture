import { existsSync } from 'node:fs'

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { EnvService } from './infra/env/env.service'
import { setupSwagger } from './presentations/http/swagger'

async function bootstrap(): Promise<void> {
  // Local development reads `.env`; containers and CI pass real environment variables.
  if (existsSync('.env')) process.loadEnvFile()

  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()
  setupSwagger(app)

  const port = app.get(EnvService).get('PORT')
  await app.listen(port)

  Logger.log(`Listening on http://localhost:${port} (docs at /docs)`, 'Bootstrap')
}

void bootstrap()
