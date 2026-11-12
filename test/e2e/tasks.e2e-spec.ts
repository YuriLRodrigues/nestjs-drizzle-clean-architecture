import { randomUUID } from 'node:crypto'

import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createAccount, createTestApp, type TestAccount } from './create-test-app'

type TaskBody = { id: string; title: string; description: string | null; status: string; completedAt: string | null }

describe('tasks (e2e)', () => {
  let app: INestApplication<App>
  let owner: TestAccount
  let stranger: TestAccount

  const api = () => request(app.getHttpServer())

  const createTask = async (account: TestAccount, body: { title: string; description?: string }) => {
    const response = await api().post('/tasks').auth(account.accessToken, { type: 'bearer' }).send(body).expect(201)
    return response.body as TaskBody
  }

  beforeAll(async () => {
    app = await createTestApp()
    owner = await createAccount(app)
    stranger = await createAccount(app)
  })

  afterAll(async () => {
    await app.close()
  })

  it('creates a task', async () => {
    const task = await createTask(owner, { title: '  Write   the README ', description: 'How to run it' })

    expect(task).toMatchObject({ title: 'Write the README', description: 'How to run it', status: 'PENDING' })
  })

  it('rejects a blank title with the domain error', async () => {
    const response = await api().post('/tasks').auth(owner.accessToken, { type: 'bearer' }).send({ title: '   ' })

    expect(response.status).toBe(422)
    expect(response.body).toMatchObject({ code: 'TASK.INVALID_TITLE', details: { maxLength: 120 } })
  })

  it("lists only the caller's tasks, with search, status and pagination", async () => {
    const account = await createAccount(app)
    await createTask(account, { title: 'Buy milk' })
    await createTask(account, { title: 'Review the pull request', description: 'Check the MILK feature flag' })
    await createTask(account, { title: 'Book flights' })
    await createTask(stranger, { title: 'Milk the cows' })

    const search = await api()
      .get('/tasks')
      .query({ search: 'milk' })
      .auth(account.accessToken, { type: 'bearer' })
      .expect(200)
    expect((search.body.results as TaskBody[]).map((task) => task.title)).toEqual([
      'Review the pull request',
      'Buy milk',
    ])

    const page = await api()
      .get('/tasks')
      .query({ page: 2, limit: 2 })
      .auth(account.accessToken, { type: 'bearer' })
      .expect(200)
    expect(page.body.meta).toEqual({ page: 2, limit: 2, totalItems: 3, totalPages: 2 })
    expect(page.body.results).toHaveLength(1)

    const done = await api()
      .get('/tasks')
      .query({ status: 'DONE' })
      .auth(account.accessToken, { type: 'bearer' })
      .expect(200)
    expect(done.body.results).toEqual([])
  })

  it('validates the list query', async () => {
    const response = await api()
      .get('/tasks')
      .query({ limit: 500, status: 'ARCHIVED' })
      .auth(owner.accessToken, { type: 'bearer' })
      .expect(400)

    expect(response.body.code).toBe('VALIDATION.FAILED')
  })

  it("hides someone else's task and answers 400 for an id that is not a UUID", async () => {
    const task = await createTask(owner, { title: 'Private' })

    const hidden = await api().get(`/tasks/${task.id}`).auth(stranger.accessToken, { type: 'bearer' }).expect(404)
    expect(hidden.body.code).toBe('TASK.NOT_FOUND')

    const unknown = await api().get(`/tasks/${randomUUID()}`).auth(owner.accessToken, { type: 'bearer' })
    expect(unknown.status).toBe(404)

    const malformed = await api().get('/tasks/not-a-uuid').auth(owner.accessToken, { type: 'bearer' }).expect(400)
    expect(malformed.body.code).toBe('HTTP.BAD_REQUEST')
  })

  it('updates only the fields sent and clears the description with null', async () => {
    const task = await createTask(owner, { title: 'Draft', description: 'Old' })

    const renamed = await api()
      .patch(`/tasks/${task.id}`)
      .auth(owner.accessToken, { type: 'bearer' })
      .send({ title: 'Final' })
      .expect(200)
    expect(renamed.body).toMatchObject({ title: 'Final', description: 'Old', updatedAt: expect.any(String) })

    const cleared = await api()
      .patch(`/tasks/${task.id}`)
      .auth(owner.accessToken, { type: 'bearer' })
      .send({ description: null })
      .expect(200)
    expect(cleared.body).toMatchObject({ title: 'Final', description: null })

    await api().patch(`/tasks/${task.id}`).auth(owner.accessToken, { type: 'bearer' }).send({ title: null }).expect(400)
  })

  it('completes a task once', async () => {
    const task = await createTask(owner, { title: 'Ship it' })

    const completed = await api()
      .patch(`/tasks/${task.id}/complete`)
      .auth(owner.accessToken, { type: 'bearer' })
      .expect(200)
    expect(completed.body).toMatchObject({ status: 'DONE', completedAt: expect.any(String) })

    const again = await api()
      .patch(`/tasks/${task.id}/complete`)
      .auth(owner.accessToken, { type: 'bearer' })
      .expect(409)
    expect(again.body.code).toBe('TASK.ALREADY_COMPLETED')
  })

  it('deletes a task', async () => {
    const task = await createTask(owner, { title: 'Temporary' })

    await api().delete(`/tasks/${task.id}`).auth(stranger.accessToken, { type: 'bearer' }).expect(404)
    await api().delete(`/tasks/${task.id}`).auth(owner.accessToken, { type: 'bearer' }).expect(204)
    await api().get(`/tasks/${task.id}`).auth(owner.accessToken, { type: 'bearer' }).expect(404)
  })

  it("lets an admin read anyone's task", async () => {
    const admin = await createAccount(app, 'ADMIN')
    const task = await createTask(owner, { title: 'Visible to admins' })

    await api().get(`/tasks/${task.id}`).auth(admin.accessToken, { type: 'bearer' }).expect(200)
  })
})
