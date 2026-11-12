# Use cases and controllers

## Use case

One class, one public method `execute(input): Promise<Either<Errors, Output>>`, one file named
`<verb>-<noun>.use-case.ts`. Input and output are exported types next to it.

```ts
export type CompleteTaskInput = { actor: Actor; taskId: string }
export type CompleteTaskOutput = Either<TaskNotFoundError | TaskAlreadyCompletedError, { task: Task }>

@Injectable()
export class CompleteTaskUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({ actor, taskId }: CompleteTaskInput): Promise<CompleteTaskOutput> {
    const task = await this.tasksRepository.findById(taskId)
    if (!task || !canAccessTask(actor, task)) return left(new TaskNotFoundError())
    if (task.isDone) return left(new TaskAlreadyCompletedError())

    task.complete()
    await this.tasksRepository.save(task)

    return right({ task })
  }
}
```

Rules:

- Depends only on abstract classes from `applications/` (repositories, gateways), never on infra.
- Receives plain data and the `Actor`; never a DTO, a request or a Nest decorator.
- Never imports another use case (lint error). Shared logic goes to:
  - a **policy** (pure function in `enterprise/policies/`), like `canAccessTask`;
  - a **repository method**, when it is a query;
  - a **domain event**, when it is a side effect;
  - a small helper in `applications/use-cases/` that is not a use case, like `normalizeDescription`.
- The output wraps values in an object (`{ task }`), so adding a field later does not break callers.

## Controller

One controller per endpoint, named `<verb>-<noun>.controller.ts`, with a single `handle` method:

```ts
@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks/:id/complete')
export class CompleteTaskController {
  constructor(private readonly completeTask: CompleteTaskUseCase) {}

  @Patch()
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: '`TASK.NOT_FOUND`' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: '`TASK.ALREADY_COMPLETED`' })
  async handle(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto> {
    const result = await this.completeTask.execute({ actor, taskId: id })

    if (result.isLeft()) throw result.value

    return TaskViewModel.toHttp(result.value.task)
  }
}
```

Three useful lines: call, throw on `Left`, map with the view model. No business rule, no repository, no `try/catch`.
Document every `DomainError` code the use case can return with an `@Api*Response` decorator.

Register both in the context's HTTP module (`presentations/http/controllers/<ctx>/<ctx>-http.module.ts`): the
controller in `controllers`, the use case in `providers`.
