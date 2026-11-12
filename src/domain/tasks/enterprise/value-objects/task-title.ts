import { ValueObject } from '@core/domain/value-object'
import { type Either, left, right } from '@core/logic/either'

import { InvalidTaskTitleError } from '../../errors/invalid-task-title.error'

type TaskTitleProps = { value: string }

/** Trimmed, inner whitespace collapsed, 1 to 120 characters. */
export class TaskTitle extends ValueObject<TaskTitleProps> {
  static readonly MAX_LENGTH = 120

  private constructor(props: TaskTitleProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  static create(raw: string): Either<InvalidTaskTitleError, TaskTitle> {
    const value = raw.trim().replace(/\s+/g, ' ')

    if (value.length === 0 || value.length > TaskTitle.MAX_LENGTH) {
      return left(new InvalidTaskTitleError(TaskTitle.MAX_LENGTH))
    }

    return right(new TaskTitle({ value }))
  }

  /** Rebuilds a title that was validated before (read from the database). */
  static restore(value: string): TaskTitle {
    return new TaskTitle({ value })
  }

  override toString(): string {
    return this.props.value
  }
}
