import { randomUUID } from 'node:crypto'

import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createAccount, createTestApp } from './create-test-app'

describe('auth (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /health answers without a token', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' })
  })

  it('POST /auth/sign-up creates an account and never returns the password', async () => {
    const email = `Jane-${randomUUID()}@Example.com`

    const response = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({ name: 'Jane Doe', email, password: 'secret123' })
      .expect(201)

    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'Jane Doe',
      email: email.toLowerCase(),
      role: 'USER',
      createdAt: expect.any(String),
    })
  })

  it('POST /auth/sign-up refuses an e-mail already registered', async () => {
    const { email } = await createAccount(app)

    const response = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({ name: 'Copy', email: email.toUpperCase(), password: 'secret123' })
      .expect(409)

    expect(response.body).toMatchObject({ statusCode: 409, code: 'USER.EMAIL_IN_USE' })
  })

  it('POST /auth/sign-up validates the body', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({ name: '', email: 'not-an-email', password: 'short', admin: true })
      .expect(400)

    expect(response.body).toMatchObject({ statusCode: 400, code: 'VALIDATION.FAILED' })
    expect(response.body.details.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('admin'), expect.stringContaining('email')]),
    )
  })

  it('POST /auth/sign-in answers 401 for a wrong password', async () => {
    const { email } = await createAccount(app)

    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ email, password: 'wrong-password' })
      .expect(401)

    expect(response.body).toMatchObject({ code: 'AUTH.INVALID_CREDENTIALS' })
  })

  it('GET /me returns the signed-in user', async () => {
    const account = await createAccount(app)

    const response = await request(app.getHttpServer())
      .get('/me')
      .auth(account.accessToken, { type: 'bearer' })
      .expect(200)

    expect(response.body).toMatchObject({ id: account.id, email: account.email, role: 'USER' })
  })

  it('GET /me answers 401 without a token or with a forged one', async () => {
    const missing = await request(app.getHttpServer()).get('/me').expect(401)
    expect(missing.body).toMatchObject({ code: 'HTTP.UNAUTHORIZED' })

    await request(app.getHttpServer()).get('/me').auth('not.a.token', { type: 'bearer' }).expect(401)
  })
})
