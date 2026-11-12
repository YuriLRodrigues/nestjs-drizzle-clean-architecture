import { DomainError } from '@core/errors/domain-error'

export class TaskAlreadyCompletedError extends DomainError {
  readonly code = 'TASK.ALREADY_COMPLETED'
  readonly httpStatus = 409

  constructor() {
    super('This task is already completed.')
  }
}
