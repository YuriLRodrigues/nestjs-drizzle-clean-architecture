# DTOs and view models

## Request DTO: the transport contract

A class with `class-validator` rules and `@ApiProperty` docs, in `controllers/<ctx>/dtos/`:

```ts
export class CreateTaskDto {
  @ApiProperty({ example: 'Write the README', description: '1 to 120 characters after trimming.' })
  @IsString()
  @MaxLength(1000)
  title: string

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null
}
```

- **DTOs check shape** (type, presence, generous size limits). **The domain checks business rules** (title 1 to 120
  characters → 422 `TASK.INVALID_TITLE`). Don't duplicate a business rule in the DTO.
- The global `ValidationPipe` uses `whitelist` and `forbidNonWhitelisted`: unknown fields are a 400, so a client can
  never sneak in `role: "ADMIN"`.
- Partial updates: `@IsOptional()` lets `null` through (use it for "clear this field"); use
  `@ValidateIf((_, value) => value !== undefined)` when `null` must be rejected.
- Query DTOs extend `PaginationQueryDto` and use `@Type(() => Number)` for numbers.

## View model: entity → JSON

```ts
export class TaskViewModel {
  static toHttp(task: Task): TaskResponseDto {
    return {
      id: task.id.toString(),
      title: task.title.value,
      completedAt: task.completedAt?.toISOString() ?? null,
      // ...
    }
  }
}
```

- The response DTO class (`TaskResponseDto`) documents the shape in Swagger; the view model builds it.
- Dates go out as ISO strings, ids as strings, value objects as their primitive.
- Secrets never leave: `UserViewModel` has no `passwordHash`.
