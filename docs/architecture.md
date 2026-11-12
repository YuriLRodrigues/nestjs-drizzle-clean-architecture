# Architecture

## The four rings

```
┌──────────────────────────────────────────────────────────────┐
│ presentations/http   controllers, DTOs, view models, guards  │
│ infra                Drizzle, bcrypt, JWT, env, subscribers  │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ domain/<context>   entities, value objects, events,  │   │
│   │                    use cases, abstract repositories  │   │
│   │   ┌──────────────────────────────────────────────┐   │   │
│   │   │ core   Entity, Either, DomainError, events   │   │   │
│   │   └──────────────────────────────────────────────┘   │   │
│   └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Dependencies point inwards.** `presentations` and `infra` depend on `domain`; `domain` depends on `core`; `core`
depends on nothing of ours. ESLint enforces it (`eslint.config.mjs`):

| Rule                                      | Blocked import                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `domain` and `core` stay pure             | `@infra/*`, `@presentations/*`, `drizzle-orm`, `pg`, `bcryptjs`, `@nestjs/jwt`, `@nestjs/swagger`, `class-validator` |
| A use case does not call another use case | `**/*.use-case` from a `*.use-case.ts`                                                                               |
| `core` knows no bounded context           | `@domain/*` from `src/core`                                                                                          |

`@nestjs/common` is allowed in the domain only for `@Injectable()`. Nest modules live in `infra` and
`presentations`, never in `domain`.

## Where things go

| You need                                   | Put it in                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| A concept with identity (User, Task)       | `domain/<ctx>/enterprise/entities/<name>.entity.ts`                         |
| A validated value (Email, TaskTitle)       | `domain/<ctx>/enterprise/value-objects/<name>.ts`                           |
| A rule that is a pure function of entities | `domain/<ctx>/enterprise/policies/<name>.policy.ts`                         |
| Something that happened                    | `domain/<ctx>/enterprise/events/<name>.event.ts`                            |
| An operation the API offers                | `domain/<ctx>/applications/use-cases/<verb>-<noun>.use-case.ts`             |
| A port to the outside (DB, crypto, e-mail) | abstract class in `domain/<ctx>/applications/<kind>/`                       |
| A business error                           | `domain/<ctx>/errors/<name>.error.ts`                                       |
| The adapter of a port                      | `infra/<kind>/...`, bound in an infra module                                |
| A table                                    | `infra/database/drizzle/schema/<table>.ts`, exported from `schema/index.ts` |
| Row ↔ entity translation                   | `infra/database/drizzle/mappers/<name>.mapper.ts`                           |
| A reaction to a domain event               | `infra/events/subscribers/on-<event>.subscriber.ts`                         |
| An endpoint                                | `presentations/http/controllers/<ctx>/<verb>-<noun>.controller.ts`          |
| Request/response shapes                    | `presentations/http/controllers/<ctx>/dtos/`                                |
| Entity → JSON                              | `presentations/http/controllers/<ctx>/view-models/`                         |

## Lifecycle of a request

1. **AuthGuard** (global) reads `Authorization: Bearer <token>`, verifies it and validates the payload with zod.
   Routes marked `@Public()` skip it. The result is `request.actor = { id, role }`.
2. **RolesGuard** (global) enforces `@Roles(...)` when the route declares it.
3. **ValidationPipe** (global, `whitelist` + `forbidNonWhitelisted` + `transform`) turns the body/query into the DTO
   class or answers 400 `VALIDATION.FAILED`.
4. The **controller** calls one use case with plain data and the actor.
5. The **use case** loads aggregates through abstract repositories, applies the rules and returns `Either`.
6. The **repository** writes and then dispatches the aggregate's domain events to the **subscribers**.
7. The controller throws `result.value` on `Left` (the **HttpErrorFilter** renders it) or maps the `Right` value with
   a **view model**.

## Why these choices

- **`Either` instead of exceptions** makes failure part of the signature: the compiler shows every caller which
  errors exist, and nothing is caught by accident.
- **Abstract classes instead of interfaces** because TypeScript interfaces disappear at runtime, and Nest needs a
  runtime token. The abstract class is both the contract and the token.
- **One controller per endpoint** keeps files small, constructor dependencies honest and merge conflicts rare.
- **View models** make the HTTP contract explicit: renaming an entity property cannot leak into the API.
- **In-memory repositories** make use case tests run in milliseconds without Nest or a database; the e2e suite
  covers the Drizzle side.
