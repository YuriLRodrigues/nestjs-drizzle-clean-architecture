import { beforeEach, describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { makeTask } from '@test/factories/make-task'
import { InMemoryTasksRepository } from '@test/repositories/in-memory-tasks.repository'

import type { Task } from '../../enterprise/entities/task.entity'
import { TaskNotFoundError } from '../../errors/task-not-found.error'
import { DeleteTaskUseCase } from './delete-task.use-case'

describe('DeleteTaskUseCase', () => {
  let tasksRepository: InMemoryTasksRepository
  let sut: DeleteTaskUseCase
  let task: Task

  beforeEach(() => {
    tasksRepository = new InMemoryTasksRepository()
    task = makeTask({ ownerId: new UniqueEntityId('owner-1') })
    tasksRepository.items.push(task)
    sut = new DeleteTaskUseCase(tasksRepository)
  })

  it('deletes the task', async () => {
    const result = await sut.execute({ actor: { id: 'owner-1', role: 'USER' }, taskId: task.id.toString() })

    expect(result.isRight()).toBe(true)
    expect(tasksRepository.items).toHaveLength(0)
  })

  it("keeps someone else's task", async () => {
    const result = await sut.execute({ actor: { id: 'intruder', role: 'USER' }, taskId: task.id.toString() })

    expect(result.value).toBeInstanceOf(TaskNotFoundError)
    expect(tasksRepository.items).toHaveLength(1)
  })
})
