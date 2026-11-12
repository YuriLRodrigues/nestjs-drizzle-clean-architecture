import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/** The body of every error response, whatever produced it. */
export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number

  @ApiProperty({ example: 'TASK.NOT_FOUND', description: 'Stable, machine-readable. Clients branch on it.' })
  code: string

  @ApiProperty({ example: 'Task not found.' })
  message: string

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  details?: Record<string, unknown>
}
