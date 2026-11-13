import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { sql } from 'drizzle-orm'

import { AppModule } from './app.module'
import { DrizzleService } from './infra/database/drizzle/drizzle.service'
import { parseEnv } from './infra/env/env'
import { AppLogger } from './infra/logger/app-logger'
import { createRequestLogMiddleware } from './infra/logger/request-log.middleware'
import { collectRoutes } from './presentations/http/route-catalog'
import { DOCS_PATH, setupSwagger } from './presentations/http/swagger'

/** `package.json` sits next to `src/` in development and next to `dist/` in the image. */
function readVersion(): string {
  try {
    const manifest = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as { version?: string }

    return manifest.version ?? '0.0.0'
  } catch {
    return process.env.npm_package_version ?? '0.0.0'
  }
}

/** A dependency that is down does not stop the boot: the line says so and the API answers 500 until it is back. */
async function checkDatabase(app: NestExpressApplication, logger: AppLogger): Promise<void> {
  const startedAt = performance.now()
  try {
    await app.get(DrizzleService).db.execute(sql`select 1`)
    logger.check({ status: 'ok', label: 'Postgres', detail: 'connected', durationMs: performance.now() - startedAt })
  } catch (error) {
    logger.check({
      status: 'fail',
      label: 'Postgres',
      detail: error instanceof Error ? error.message || error.name : String(error),
      durationMs: performance.now() - startedAt,
      hint: 'is the database up? `docker compose up -d`, then `npm run db:migrate`',
    })
  }
}

async function bootstrap(logger: AppLogger): Promise<void> {
  const startedAt = performance.now()
  await logger.detectBackground()
  logger.banner({
    version: readVersion(),
    env: process.env.NODE_ENV ?? 'development',
    node: process.version,
    pid: process.pid,
  })

  // Validated here, before Nest starts, so a bad `.env` is one readable block instead of a stack from a provider.
  const envStartedAt = performance.now()
  const env = parseEnv(process.env)
  logger.check({ status: 'ok', label: 'env', detail: 'validated (zod)', durationMs: performance.now() - envStartedAt })

  // `abortOnError: false`: a failed boot is thrown, so it reaches the block in `main()` below.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger, abortOnError: false })
  app.enableShutdownHooks()
  app.use(createRequestLogMiddleware(logger))

  await checkDatabase(app, logger)

  setupSwagger(app)
  logger.check({ status: 'ok', label: 'Swagger', detail: DOCS_PATH })

  await app.listen(env.PORT)

  logger.routes(collectRoutes(app))
  logger.ready({
    elapsedMs: performance.now() - startedAt,
    url: `http://localhost:${env.PORT}`,
    docsPath: DOCS_PATH,
  })
}

async function main(): Promise<void> {
  // Local development reads `.env`; containers and CI pass real environment variables.
  if (existsSync('.env')) process.loadEnvFile()

  const logger = new AppLogger()
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => logger.warn(`${signal} received, shutting down`, 'Shutdown'))
  }

  try {
    await bootstrap(logger)
  } catch (error) {
    logger.bootFailed(error)
    process.exit(1)
  }
}

void main()
