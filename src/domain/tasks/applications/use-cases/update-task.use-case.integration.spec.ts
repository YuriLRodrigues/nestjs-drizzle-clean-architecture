import { beforeEach, describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { makeTask } from '@test/factories/make-task'
import { InMemoryTasksRepository } from '@test/repositories/in-memory-tasks.repository'

import type { Task } from '../../enterprise/entities/task.entity'
import { InvalidTaskTitleError } from '../../errors/invalid-task-title.error'
import { TaskNotFoundError } from '../../errors/task-not-found.error'
import { UpdateTaskUseCase } from './update-task.use-case'

describe('UpdateTaskUseCase', () => {
  let tasksRepository: InMemoryTasksRepository
  let sut: UpdateTaskUseCase
  let task: Task
  const actor = { id: 'owner-1', role: 'USER' as const }

  beforeEach(() => {
    tasksRepository = new InMemoryTasksRepository()
    task = makeTask({ ownerId: new UniqueEntityId('owner-1'), description: 'Old description' })
    tasksRepository.items.push(task)
    sut = new UpdateTaskUseCase(tasksRepository)
  })

  it('changes only the fields that were sent', async () => {
    const result = await sut.execute({ actor, taskId: task.id.toString(), title: 'New title' })

    expect(result.isRight()).toBe(true)
    expect(task.title.value).toBe('New title')
    expect(task.description).toBe('Old description')
    expect(task.updatedAt).toBeInstanceOf(Date)
  })

  it('clears the description with null', async () => {
    await sut.execute({ actor, taskId: task.id.toString(), description: null })

    expect(task.description).toBeNull()
  })

  it('rejects an invalid title without changing anything', async () => {
    const result = await sut.execute({ actor, taskId: task.id.toString(), title: '', description: 'Changed' })

    expect(result.value).toBeInstanceOf(InvalidTaskTitleError)
    expect(task.description).toBe('Old description')
  })

  it("answers not found for someone else's task", async () => {
    const result = await sut.execute({ actor: { id: 'intruder', role: 'USER' }, taskId: task.id.toString() })

    expect(result.value).toBeInstanceOf(TaskNotFoundError)
  })
})
