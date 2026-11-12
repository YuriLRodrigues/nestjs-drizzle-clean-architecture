import { beforeEach, describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { makeTask } from '@test/factories/make-task'
import { InMemoryTasksRepository } from '@test/repositories/in-memory-tasks.repository'

import { TaskNotFoundError } from '../../errors/task-not-found.error'
import { GetTaskUseCase } from './get-task.use-case'

describe('GetTaskUseCase', () => {
  let tasksRepository: InMemoryTasksRepository
  let sut: GetTaskUseCase
  const task = makeTask({ ownerId: new UniqueEntityId('owner-1') })

  beforeEach(() => {
    tasksRepository = new InMemoryTasksRepository()
    tasksRepository.items.push(task)
    sut = new GetTaskUseCase(tasksRepository)
  })

  it('returns the task to its owner', async () => {
    const result = await sut.execute({ actor: { id: 'owner-1', role: 'USER' }, taskId: task.id.toString() })

    expect(result.value).toEqual({ task })
  })

  it('returns the task to an admin', async () => {
    const result = await sut.execute({ actor: { id: 'admin-1', role: 'ADMIN' }, taskId: task.id.toString() })

    expect(result.isRight()).toBe(true)
  })

  it("answers not found for someone else's task", async () => {
    const result = await sut.execute({ actor: { id: 'intruder', role: 'USER' }, taskId: task.id.toString() })

    expect(result.value).toBeInstanceOf(TaskNotFoundError)
  })

  it('answers not found for a task that does not exist', async () => {
    const result = await sut.execute({ actor: { id: 'owner-1', role: 'USER' }, taskId: 'missing' })

    expect(result.value).toBeInstanceOf(TaskNotFoundError)
  })
})
