import { beforeEach, describe, expect, it } from 'vitest'

import { InMemoryTasksRepository } from '@test/repositories/in-memory-tasks.repository'

import { InvalidTaskTitleError } from '../../errors/invalid-task-title.error'
import { CreateTaskUseCase } from './create-task.use-case'

describe('CreateTaskUseCase', () => {
  let tasksRepository: InMemoryTasksRepository
  let sut: CreateTaskUseCase
  const actor = { id: 'owner-1', role: 'USER' as const }

  beforeEach(() => {
    tasksRepository = new InMemoryTasksRepository()
    sut = new CreateTaskUseCase(tasksRepository)
  })

  it('creates a pending task owned by the actor', async () => {
    const result = await sut.execute({ actor, title: ' Write the README ', description: '  ' })

    expect(result.isRight()).toBe(true)
    expect(tasksRepository.items).toHaveLength(1)

    const [task] = tasksRepository.items
    expect(task.ownerId.toString()).toBe('owner-1')
    expect(task.title.value).toBe('Write the README')
    expect(task.description).toBeNull()
    expect(task.status).toBe('PENDING')
  })

  it('rejects an empty title', async () => {
    const result = await sut.execute({ actor, title: '   ' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidTaskTitleError)
    expect(tasksRepository.items).toHaveLength(0)
  })
})
