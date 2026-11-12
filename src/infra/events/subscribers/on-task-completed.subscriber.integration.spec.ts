import { Logger } from '@nestjs/common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { DomainEvents } from '@core/events/domain-events'
import { CompleteTaskUseCase } from '@domain/tasks/applications/use-cases/complete-task.use-case'
import { makeTask } from '@test/factories/make-task'
import { InMemoryTasksRepository } from '@test/repositories/in-memory-tasks.repository'

import { OnTaskCompleted } from './on-task-completed.subscriber'

describe('OnTaskCompleted', () => {
  afterEach(() => {
    DomainEvents.clearHandlers()
    DomainEvents.clearMarkedAggregates()
    vi.restoreAllMocks()
  })

  it('reacts once the completed task is saved', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
    const subscriber = new OnTaskCompleted()
    subscriber.setupSubscriptions()

    const tasksRepository = new InMemoryTasksRepository()
    const task = makeTask({ ownerId: new UniqueEntityId('owner-1') })
    tasksRepository.items.push(task)

    await new CompleteTaskUseCase(tasksRepository).execute({
      actor: { id: 'owner-1', role: 'USER' },
      taskId: task.id.toString(),
    })

    expect(log).toHaveBeenCalledWith(`Task ${task.id.toString()} completed by owner owner-1`)
  })

  it('stops reacting after the module is destroyed', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
    const subscriber = new OnTaskCompleted()
    subscriber.onModuleInit()
    subscriber.onModuleDestroy()

    const tasksRepository = new InMemoryTasksRepository()
    const task = makeTask()
    task.complete()
    await tasksRepository.save(task)

    expect(log).not.toHaveBeenCalled()
  })
})
