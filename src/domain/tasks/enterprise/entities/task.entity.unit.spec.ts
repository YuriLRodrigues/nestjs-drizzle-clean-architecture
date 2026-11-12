import { afterEach, describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { DomainEvents } from '@core/events/domain-events'

import { TaskCompletedEvent } from '../events/task-completed.event'
import { TaskTitle } from '../value-objects/task-title'
import { Task } from './task.entity'

const makeTask = () => Task.create({ ownerId: new UniqueEntityId(), title: TaskTitle.restore('Write the README') })

describe('Task', () => {
  afterEach(() => DomainEvents.clearMarkedAggregates())

  it('starts pending, without description or dates', () => {
    const task = makeTask()

    expect(task.status).toBe('PENDING')
    expect(task.isDone).toBe(false)
    expect(task.description).toBeNull()
    expect(task.updatedAt).toBeNull()
    expect(task.completedAt).toBeNull()
  })

  it('completes once and raises TaskCompletedEvent', () => {
    const task = makeTask()
    const now = new Date('2026-11-12T10:00:00Z')

    task.complete(now)
    task.complete(new Date('2026-11-13T10:00:00Z'))

    expect(task.status).toBe('DONE')
    expect(task.completedAt).toEqual(now)
    expect(task.updatedAt).toEqual(now)
    expect(task.domainEvents).toHaveLength(1)
    expect(task.domainEvents[0]).toBeInstanceOf(TaskCompletedEvent)
  })

  it('records when it was renamed or described', () => {
    const task = makeTask()

    task.rename(TaskTitle.restore('Write the docs'))
    task.describe('Architecture and patterns')

    expect(task.title.value).toBe('Write the docs')
    expect(task.description).toBe('Architecture and patterns')
    expect(task.updatedAt).toBeInstanceOf(Date)
  })
})
