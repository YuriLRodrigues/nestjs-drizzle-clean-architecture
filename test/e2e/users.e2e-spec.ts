import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createAccount, createTestApp } from './create-test-app'

describe('users (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /users is forbidden for a regular user', async () => {
    const user = await createAccount(app)

    const response = await request(app.getHttpServer())
      .get('/users')
      .auth(user.accessToken, { type: 'bearer' })
      .expect(403)

    expect(response.body).toMatchObject({ statusCode: 403, code: 'HTTP.FORBIDDEN' })
  })

  it('GET /users lists accounts for an admin, newest first', async () => {
    const admin = await createAccount(app, 'ADMIN')

    const response = await request(app.getHttpServer())
      .get('/users')
      .query({ limit: 1 })
      .auth(admin.accessToken, { type: 'bearer' })
      .expect(200)

    expect(response.body.results).toEqual([expect.objectContaining({ id: admin.id, role: 'ADMIN' })])
    expect(response.body.results[0]).not.toHaveProperty('passwordHash')
    expect(response.body.meta).toMatchObject({ page: 1, limit: 1 })
  })
})
