import { ApiProperty } from '@nestjs/swagger'

import { type TaskStatus, taskStatuses } from '@domain/tasks/enterprise/task-status'

import { PaginationMetaDto } from '../../../pagination/pagination-meta.dto'

export class TaskResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  ownerId: string

  @ApiProperty({ example: 'Write the README' })
  title: string

  @ApiProperty({ type: String, nullable: true, example: 'Explain how to run the project.' })
  description: string | null

  @ApiProperty({ enum: taskStatuses, example: 'PENDING' })
  status: TaskStatus

  @ApiProperty({ format: 'date-time' })
  createdAt: string

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  updatedAt: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  completedAt: string | null
}

export class TasksPageResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  results: TaskResponseDto[]

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto
}
