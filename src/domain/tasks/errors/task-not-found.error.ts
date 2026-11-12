import { DomainError } from '@core/errors/domain-error'

/** Also returned for someone else's task, so ids of other people's tasks cannot be probed. */
export class TaskNotFoundError extends DomainError {
  readonly code = 'TASK.NOT_FOUND'
  readonly httpStatus = 404

  constructor() {
    super('Task not found.')
  }
}
