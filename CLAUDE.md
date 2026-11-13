# CLAUDE.md

Guidance for Claude Code in this repository.

## What this is

A NestJS 12 + Drizzle ORM 1.0 backend template with Clean Architecture. `identity` and `tasks` are executable
examples of the patterns: when adding something, find the closest example in them and follow it.

## Commands

```bash
npm run start:dev        # API on :3333, Swagger at /docs (needs DATABASE_URL, see .env.example)
npm test                 # unit + integration
npm run test:e2e         # e2e over HTTP; PGlite when DATABASE_URL is not set (no Docker needed)
npm run lint:check       # ESLint (type-checked, includes the layer rules)
npm run typecheck
npm run build
npm run db:generate -- --name <kebab-name>   # migration from the schema diff
```

Before saying a change is done, run `npm run lint:check`, `npm run typecheck`, `npm test` and, when HTTP or
persistence changed, `npm run test:e2e`.

## Architecture (read docs/architecture.md for the full map)

- `src/core`: framework-free building blocks (`Entity`, `AggregateRoot`, `ValueObject`, `UniqueEntityId`, `Either`,
  `DomainError`, `DomainEvents`, pagination, `Actor`).
- `src/domain/<context>`: `enterprise/` (entities, value objects, events, policies), `applications/` (use cases and
  abstract repositories/gateways), `errors/`.
- `src/infra`: env, Drizzle (schema, mappers, repositories, migrator), cryptography, event subscribers.
- `src/presentations/http`: one controller per endpoint, DTOs, view models, guards, the error filter, one HTTP module
  per context.

The dependency rule is enforced by ESLint. Never silence it with `eslint-disable`; move the code to the right layer.

## Rules

1. Use cases return `Either<DomainError, T>` and never throw for business rules. Output values are wrapped in an
   object (`right({ task })`).
2. Controllers: call the use case, `if (result.isLeft()) throw result.value`, return `ViewModel.toHttp(...)`.
3. Use cases depend on abstract classes (the DI tokens), never on infra classes. A use case never imports another use
   case: use a policy, a repository method, a domain event or a plain helper.
4. Entities change through intention-revealing methods; value objects validate in `create()` (returns `Either`) and
   rebuild trusted data with `restore()`.
5. Every business error extends `DomainError` with a stable `CONTEXT.REASON` code. Never rename or reuse a code.
   Someone else's resource answers 404, not 403.
6. Entities never leave through HTTP: response DTO + view model. Secrets (password hash) never leave at all.
7. DTOs validate shape; the domain validates business rules. The global `ValidationPipe` forbids unknown fields.
8. Every route is private unless marked `@Public()`. Read the caller with `@CurrentActor()`; restrict with
   `@Roles('ADMIN')`.
9. Lists follow the listing contract: `page`/`limit`/`search` in, `{ results, meta }` out (docs/patterns/listing-contract.md).
10. Repositories dispatch domain events after `create`/`save`/`delete`. Subscribers catch their own errors.
11. Never write or edit a migration by hand: change the schema, run `npm run db:generate`, review the SQL.
12. Tests are born with the code: `*.unit.spec.ts` for pure code, `*.integration.spec.ts` for use cases with
    in-memory repositories and `make*` factories, e2e for routes. Cover every `Left` a use case declares.
13. Log through Nest's `Logger` (never `console.log`), pass the `Error` itself to `logger.error`, and do not log
    expected `DomainError`s, secrets or request bodies. The domain does not log (docs/patterns/logging.md).
14. Exact dependency versions (`.npmrc` has `save-exact`). Conventional Commits (commitlint runs on `commit-msg`).

## Naming

| Thing                | File                                              | Class                     |
| -------------------- | ------------------------------------------------- | ------------------------- |
| Entity               | `task.entity.ts`                                  | `Task`                    |
| Value object         | `task-title.ts`                                   | `TaskTitle`               |
| Use case             | `complete-task.use-case.ts`                       | `CompleteTaskUseCase`     |
| Error                | `task-not-found.error.ts`                         | `TaskNotFoundError`       |
| Abstract repository  | `tasks.repository.ts`                             | `TasksRepository`         |
| Drizzle repository   | `drizzle-tasks.repository.ts`                     | `DrizzleTasksRepository`  |
| Mapper               | `task.mapper.ts`                                  | `TaskMapper`              |
| Controller           | `complete-task.controller.ts`                     | `CompleteTaskController`  |
| View model           | `task.view-model.ts`                              | `TaskViewModel`           |
| Subscriber           | `on-task-completed.subscriber.ts`                 | `OnTaskCompleted`         |
| In-memory repository | `test/repositories/in-memory-tasks.repository.ts` | `InMemoryTasksRepository` |
| Factory              | `test/factories/make-task.ts`                     | `makeTask()`              |

## Skills

- `/new-module <context>`: scaffold a whole bounded context.
- `/new-use-case <context> <verb-noun>`: one use case end to end.
- `/new-migration <description>`: schema change + generated migration.
- `/pattern-review`: review the current diff against these rules.
