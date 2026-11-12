import { describe, expect, it } from 'vitest'

import { InvalidTaskTitleError } from '../../errors/invalid-task-title.error'
import { TaskTitle } from './task-title'

describe('TaskTitle', () => {
  it('trims and collapses whitespace', () => {
    const result = TaskTitle.create('  Write   the   README  ')

    expect(result.isRight()).toBe(true)
    expect((result.value as TaskTitle).value).toBe('Write the README')
  })

  it('accepts exactly 120 characters', () => {
    expect(TaskTitle.create('a'.repeat(120)).isRight()).toBe(true)
  })

  it.each(['', '   ', 'a'.repeat(121)])('rejects %j', (raw) => {
    const result = TaskTitle.create(raw)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidTaskTitleError)
  })
})
