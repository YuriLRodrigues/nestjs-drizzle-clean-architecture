---
name: new-use-case
description: Add one use case end to end in this NestJS + Drizzle template - use case with Either, its integration spec, errors, controller, DTOs, view model, Swagger and module wiring. Use when the user asks for a new endpoint, operation or business rule in an existing bounded context.
---

# New use case

Arguments: the bounded context (`tasks`) and the operation as `verb-noun` (`archive-task`). Ask for whatever is
missing, plus: the HTTP method and route, who may call it (public, any user, owner, `ADMIN`) and every way it can fail.

Read the closest example first and copy its shape: `src/domain/tasks/applications/use-cases/complete-task.use-case.ts`,
its `.integration.spec.ts` and `src/presentations/http/controllers/tasks/complete-task.controller.ts`.

## Steps

1. **Errors**: for each failure, create `src/domain/<ctx>/errors/<reason>.error.ts` extending `DomainError` with a new
   `CONTEXT.REASON` code and its HTTP status. Reuse an existing error only if it means exactly the same thing. Never
   rename an existing code.
2. **Test first**: create `src/domain/<ctx>/applications/use-cases/<verb-noun>.use-case.integration.spec.ts` with the
   in-memory repository and `make*` factories. One `it` for the happy path and one for every `Left`. Run
   `npx vitest run <spec path>` and watch it fail.
3. **Use case**: `<verb-noun>.use-case.ts` with exported `Input`/`Output` types,
   `Output = Either<ErrorA | ErrorB, { ... }>`, `@Injectable()`, dependencies on abstract classes only. Access rules
   go through a policy in `enterprise/policies/` (create one if needed, with a unit spec). If it needs a new
   repository method, add it to the abstract class, the in-memory repository and the Drizzle repository.
4. **Run the spec** until green.
5. **DTOs** in `src/presentations/http/controllers/<ctx>/dtos/`: request DTO with `class-validator` + `@ApiProperty`
   (shape only; business rules stay in the domain). List endpoints extend `PaginationQueryDto`. Reuse the response DTO
   and view model when the output is an existing entity.
6. **Controller** `<verb-noun>.controller.ts`: one class, one `handle` method, `@ApiTags`, `@ApiBearerAuth` unless
   `@Public()`, `@Roles(...)` if restricted, `ParseUUIDPipe` on ids, and one `@Api*Response` per error code with
   `type: ErrorResponseDto` and the code in `description`. Body: call, `if (result.isLeft()) throw result.value`,
   return the view model.
7. **Wire** both in `src/presentations/http/controllers/<ctx>/<ctx>-http.module.ts` (controller in `controllers`, use
   case in `providers`).
8. **E2E**: add the route to `test/e2e/<ctx>.e2e-spec.ts`: success, one domain error, and 401/403 if protected.
9. **Verify**: `npm run lint:check`, `npm run typecheck`, `npm test`, `npm run test:e2e`.

## Do not

- Import another use case (lint blocks it), a Drizzle type or anything from `infra`/`presentations` in the domain.
- Throw from the use case for a business rule.
- Return the entity from the controller.
