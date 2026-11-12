import { randomUUID } from 'node:crypto'

import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import type { App } from 'supertest/types'
import { inject } from 'vitest'

import type { Role } from '@core/auth/actor'
import { DrizzleService } from '@infra/database/drizzle/drizzle.service'
import { users } from '@infra/database/drizzle/schema'

import { AppModule } from '../../src/app.module'

/** The real AppModule (guards, filter, pipe, Drizzle) against the database prepared by `global-setup.ts`. */
export async function createTestApp(): Promise<INestApplication<App>> {
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = inject('databaseUrl')
  process.env.DATABASE_POOL_MAX = String(inject('databasePoolMax'))
  process.env.JWT_SECRET = 'e2e-secret-with-at-least-thirty-two-characters'

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = moduleRef.createNestApplication<INestApplication<App>>({ logger: false })
  await app.init()

  return app
}

export type TestAccount = { id: string; email: string; password: string; accessToken: string }

/** Signs up a brand-new account (unique e-mail), optionally promotes it, and signs in. */
export async function createAccount(app: INestApplication<App>, role: Role = 'USER'): Promise<TestAccount> {
  const email = `e2e-${randomUUID()}@example.com`
  const password = 'secret123'

  const signUp = await request(app.getHttpServer()).post('/auth/sign-up').send({ name: 'E2E User', email, password })
  if (signUp.status !== 201) throw new Error(`sign-up failed: ${signUp.status} ${JSON.stringify(signUp.body)}`)

  if (role !== 'USER') {
    await app.get(DrizzleService).db.update(users).set({ role }).where(eq(users.email, email))
  }

  const signIn = await request(app.getHttpServer()).post('/auth/sign-in').send({ email, password })

  return {
    id: (signUp.body as { id: string }).id,
    email,
    password,
    accessToken: (signIn.body as { accessToken: string }).accessToken,
  }
}
