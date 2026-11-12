import { beforeEach, describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { makeTask } from '@test/factories/make-task'
import { InMemoryTasksRepository } from '@test/repositories/in-memory-tasks.repository'

import { TaskTitle } from '../../enterprise/value-objects/task-title'
import { ListTasksUseCase } from './list-tasks.use-case'

describe('ListTasksUseCase', () => {
  let tasksRepository: InMemoryTasksRepository
  let sut: ListTasksUseCase
  const ownerId = new UniqueEntityId('owner-1')

  beforeEach(() => {
    tasksRepository = new InMemoryTasksRepository()
    sut = new ListTasksUseCase(tasksRepository)

    tasksRepository.items.push(
      makeTask({ ownerId, title: TaskTitle.restore('Buy milk'), createdAt: new Date(2026, 0, 1) }),
      makeTask({ ownerId, title: TaskTitle.restore('Write docs'), status: 'DONE', createdAt: new Date(2026, 0, 2) }),
      makeTask({ ownerId, title: TaskTitle.restore('Review PR'), createdAt: new Date(2026, 0, 3) }),
      makeTask({ title: TaskTitle.restore("Someone else's task"), createdAt: new Date(2026, 0, 4) }),
    )
  })

  const titlesOf = (result: Awaited<ReturnType<ListTasksUseCase['execute']>>) =>
    result.isRight() ? result.value.tasks.results.map((task) => task.title.value) : []

  it("lists only the user's own tasks, newest first", async () => {
    const result = await sut.execute({ actor: { id: 'owner-1', role: 'USER' }, page: 1, limit: 20 })

    expect(titlesOf(result)).toEqual(['Review PR', 'Write docs', 'Buy milk'])
  })

  it("lists everyone's tasks for an admin", async () => {
    const result = await sut.execute({ actor: { id: 'admin-1', role: 'ADMIN' }, page: 1, limit: 20 })

    expect(titlesOf(result)).toHaveLength(4)
  })

  it('filters by status and searches the title case-insensitively', async () => {
    const actor = { id: 'owner-1', role: 'USER' as const }

    expect(titlesOf(await sut.execute({ actor, page: 1, limit: 20, status: 'DONE' }))).toEqual(['Write docs'])
    expect(titlesOf(await sut.execute({ actor, page: 1, limit: 20, search: ' MILK ' }))).toEqual(['Buy milk'])
  })

  it('paginates', async () => {
    const result = await sut.execute({ actor: { id: 'owner-1', role: 'USER' }, page: 2, limit: 2 })

    expect(titlesOf(result)).toEqual(['Buy milk'])
    expect(result.isRight() && result.value.tasks.meta).toEqual({ page: 2, limit: 2, totalItems: 3, totalPages: 2 })
  })
})
