import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { DomainEvents } from '@core/events/domain-events'
import { makeTask } from '@test/factories/make-task'
import { InMemoryTasksRepository } from '@test/repositories/in-memory-tasks.repository'

import type { Task } from '../../enterprise/entities/task.entity'
import { TaskCompletedEvent } from '../../enterprise/events/task-completed.event'
import { TaskAlreadyCompletedError } from '../../errors/task-already-completed.error'
import { TaskNotFoundError } from '../../errors/task-not-found.error'
import { CompleteTaskUseCase } from './complete-task.use-case'

describe('CompleteTaskUseCase', () => {
  let tasksRepository: InMemoryTasksRepository
  let sut: CompleteTaskUseCase
  let task: Task
  const actor = { id: 'owner-1', role: 'USER' as const }

  beforeEach(() => {
    tasksRepository = new InMemoryTasksRepository()
    task = makeTask({ ownerId: new UniqueEntityId('owner-1') })
    tasksRepository.items.push(task)
    sut = new CompleteTaskUseCase(tasksRepository)
  })

  afterEach(() => {
    DomainEvents.clearHandlers()
    DomainEvents.clearMarkedAggregates()
  })

  it('completes the task and dispatches TaskCompletedEvent after saving', async () => {
    const handler = vi.fn()
    DomainEvents.register(handler, TaskCompletedEvent.name)

    const result = await sut.execute({ actor, taskId: task.id.toString() })

    expect(result.isRight()).toBe(true)
    expect(task.status).toBe('DONE')
    expect(task.completedAt).toBeInstanceOf(Date)
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ task }))
  })

  it('refuses to complete a task twice', async () => {
    await sut.execute({ actor, taskId: task.id.toString() })

    const result = await sut.execute({ actor, taskId: task.id.toString() })

    expect(result.value).toBeInstanceOf(TaskAlreadyCompletedError)
  })

  it("answers not found for someone else's task", async () => {
    const result = await sut.execute({ actor: { id: 'intruder', role: 'USER' }, taskId: task.id.toString() })

    expect(result.value).toBeInstanceOf(TaskNotFoundError)
    expect(task.status).toBe('PENDING')
  })
})
