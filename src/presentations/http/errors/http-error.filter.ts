import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { Response } from 'express'

import { DomainError } from '@core/errors/domain-error'

import type { ErrorResponseDto } from './error-response.dto'

/**
 * Renders every error as `{ statusCode, code, message, details? }`:
 * - `DomainError` → its own code and status;
 * - validation errors (ValidationPipe) → 400 `VALIDATION.FAILED` with the messages in `details.errors`;
 * - other `HttpException`s → `HTTP.<STATUS_NAME>` (e.g. `HTTP.UNAUTHORIZED`);
 * - anything else → 500 `INTERNAL.UNEXPECTED`, logged with its stack and never echoed to the client.
 */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = this.toBody(exception)
    host.switchToHttp().getResponse<Response>().status(body.statusCode).json(body)
  }

  private toBody(exception: unknown): ErrorResponseDto {
    if (exception instanceof DomainError) {
      return {
        statusCode: exception.httpStatus,
        code: exception.code,
        message: exception.message,
        ...(exception.details && { details: exception.details }),
      }
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus()
      const response = exception.getResponse()
      const messages = typeof response === 'object' && 'message' in response ? response.message : undefined

      if (Array.isArray(messages)) {
        return {
          statusCode,
          code: 'VALIDATION.FAILED',
          message: 'Request validation failed.',
          details: { errors: messages },
        }
      }

      return { statusCode, code: `HTTP.${HttpStatus[statusCode] ?? 'ERROR'}`, message: exception.message }
    }

    this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception))

    return { statusCode: 500, code: 'INTERNAL.UNEXPECTED', message: 'Something went wrong.' }
  }
}
