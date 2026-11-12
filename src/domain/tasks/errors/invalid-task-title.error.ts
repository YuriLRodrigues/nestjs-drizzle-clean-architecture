import { DomainError } from '@core/errors/domain-error'

export class InvalidTaskTitleError extends DomainError {
  readonly code = 'TASK.INVALID_TITLE'
  readonly httpStatus = 422

  constructor(maxLength: number) {
    super(`The title must have between 1 and ${maxLength} characters.`, { maxLength })
  }
}
