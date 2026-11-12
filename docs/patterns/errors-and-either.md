# Errors and Either

## Either

```ts
type Either<L, R> = Left<L, R> | Right<L, R>

const result = await useCase.execute(input)
if (result.isLeft()) {
  result.value // the error, typed as the union the use case declared
} else {
  result.value // the output
}
```

`left(error)` and `right(value)` build them. Value objects use the same shape in `create()`:
`TaskTitle.create(raw): Either<InvalidTaskTitleError, TaskTitle>`.

## DomainError

Every business error extends `DomainError` and declares a stable `code` and an `httpStatus`:

```ts
export class TaskAlreadyCompletedError extends DomainError {
  readonly code = 'TASK.ALREADY_COMPLETED'
  readonly httpStatus = 409

  constructor() {
    super('This task is already completed.')
  }
}
```

- `code` is `CONTEXT.REASON` in upper snake case. It is a public contract: clients branch on it. Never rename or
  reuse one.
- `details` (optional, second `super` argument) carries structured data, such as `{ maxLength: 120 }`.
- Use **404 for someone else's resource** (`TASK.NOT_FOUND`), so ids cannot be probed.
- Use the same error for "unknown e-mail" and "wrong password" (`AUTH.INVALID_CREDENTIALS`).

## What the client receives

`HttpErrorFilter` renders every error with one shape:

```json
{
  "statusCode": 422,
  "code": "TASK.INVALID_TITLE",
  "message": "The title must have between 1 and 120 characters.",
  "details": { "maxLength": 120 }
}
```

| Source                                                         | `code`                                                                                       |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A `DomainError`                                                | its own code                                                                                 |
| `ValidationPipe`                                               | `VALIDATION.FAILED`, messages in `details.errors`                                            |
| Other `HttpException` (guards, `ParseUUIDPipe`, unknown route) | `HTTP.<STATUS>`: `HTTP.UNAUTHORIZED`, `HTTP.FORBIDDEN`, `HTTP.BAD_REQUEST`, `HTTP.NOT_FOUND` |
| Anything else                                                  | 500 `INTERNAL.UNEXPECTED`; the stack goes to the log, never to the client                    |

Throw only for programming errors and infrastructure failures (the database is down). Those become 500.
