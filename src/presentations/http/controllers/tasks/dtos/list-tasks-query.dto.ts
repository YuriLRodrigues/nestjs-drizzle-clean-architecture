import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

import { type TaskStatus, taskStatuses } from '@domain/tasks/enterprise/task-status'

import { PaginationQueryDto } from '../../../pagination/pagination-query.dto'

export class ListTasksQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Case-insensitive match on title or description.', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string

  @ApiPropertyOptional({ enum: taskStatuses })
  @IsOptional()
  @IsIn(taskStatuses)
  status?: TaskStatus
}
