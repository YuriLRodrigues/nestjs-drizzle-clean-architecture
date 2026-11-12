import { describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'

import { Task } from '../entities/task.entity'
import { TaskTitle } from '../value-objects/task-title'
import { canAccessTask } from './task-access.policy'

describe('canAccessTask', () => {
  const ownerId = new UniqueEntityId()
  const task = Task.create({ ownerId, title: TaskTitle.restore('Task') })

  it('lets the owner in', () => {
    expect(canAccessTask({ id: ownerId.toString(), role: 'USER' }, task)).toBe(true)
  })

  it('lets any admin in', () => {
    expect(canAccessTask({ id: 'someone-else', role: 'ADMIN' }, task)).toBe(true)
  })

  it('keeps other users out', () => {
    expect(canAccessTask({ id: 'someone-else', role: 'USER' }, task)).toBe(false)
  })
})
