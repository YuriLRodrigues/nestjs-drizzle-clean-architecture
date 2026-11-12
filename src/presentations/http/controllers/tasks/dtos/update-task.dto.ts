import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator'

/** Absent fields are kept. `description: null` clears it; `title: null` is rejected. */
export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Write the docs' })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(1000)
  title?: string

  @ApiPropertyOptional({ example: 'Architecture and patterns.', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null
}
