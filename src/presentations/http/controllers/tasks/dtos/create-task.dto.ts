import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

/**
 * Transport rules only (type, generous size limits). Business rules such as the title length live in the domain
 * (`TaskTitle`) and come back as 422 `TASK.INVALID_TITLE`.
 */
export class CreateTaskDto {
  @ApiProperty({ example: 'Write the README', description: '1 to 120 characters after trimming.' })
  @IsString()
  @MaxLength(1000)
  title: string

  @ApiPropertyOptional({ type: String, example: 'Explain how to run the project.', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null
}
