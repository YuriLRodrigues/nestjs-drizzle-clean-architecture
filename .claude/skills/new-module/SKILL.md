---
name: new-module
description: Scaffold a complete bounded context in this NestJS + Drizzle template - entity, value objects, errors, abstract repository, use cases, Drizzle schema, mapper and repository, migration, HTTP module with controllers, in-memory repository, factory and tests. Use when the user wants a new resource, feature area or context (for example "add products", "create a comments module").
---

# New module (bounded context)

The `tasks` context is the reference implementation. Mirror its files one by one.

## 1. Agree on the model before writing code

Ask for (or propose and confirm):

- the context name (plural kebab-case, `products`) and the aggregate (`Product`);
- the props with types, which are optional, and which are value objects (anything with validation or normalisation);
- the operations (`create`, `list`, `get`, `update`, `delete`, domain verbs like `publish`);
- who can do what (owner, `ADMIN`, public) and every business error;
- events worth raising (past tense: `ProductPublishedEvent`), if any.

## 2. Domain (`src/domain/<ctx>/`)

1. `enterprise/<status>.ts` for enums as `as const` lists (they feed the database enum).
2. `enterprise/value-objects/<name>.ts` with `create()` → `Either` and `restore()`, plus a `.unit.spec.ts`.
3. `enterprise/entities/<name>.entity.ts` extending `AggregateRoot`, props as a `type`, getters, intention-revealing
   methods, `static create()` with defaults, plus a `.unit.spec.ts`.
4. `enterprise/policies/<name>-access.policy.ts` if access depends on the resource, plus a `.unit.spec.ts`.
5. `errors/*.error.ts`, one `DomainError` per failure, codes `CONTEXT.REASON`.
6. `applications/repositories/<plural>.repository.ts`: abstract class; `findMany` takes `PaginationParams` and
   returns `Paginated<T>`.
7. Test helpers: `test/factories/make-<name>.ts` and `test/repositories/in-memory-<plural>.repository.ts`
   (same contract, including search and `DomainEvents.dispatchEventsForAggregate` after writes).
8. One use case per operation, each with its integration spec written first (follow the `new-use-case` skill for
   each).

Run `npm test` before moving on.

## 3. Infra (`src/infra/database/drizzle/`)

1. `schema/<plural>.ts` (relative imports only), exported from `schema/index.ts`; `$inferSelect`/`$inferInsert`
   types; indexes for the list's `where` + `order by`.
2. `mappers/<name>.mapper.ts` with `toDomain(row)` and `toPersistence(entity)`.
3. `repositories/drizzle-<plural>.repository.ts`: same behaviour as the in-memory one; `containsPattern()` for
   search; order by `created_at desc, id desc`.
4. Bind it in `infra/database/database.module.ts` (`{ provide: XRepository, useClass: DrizzleXRepository }`) and
   export the token.
5. `npm run db:generate -- --name create-<plural>` and read the SQL (see the `new-migration` skill).
6. Subscribers, if any, in `infra/events/subscribers/`, registered in `infra/events/events.module.ts`.

## 4. HTTP (`src/presentations/http/controllers/<ctx>/`)

1. `dtos/` (request DTOs, query DTO extending `PaginationQueryDto`, response DTO + page DTO).
2. `view-models/<name>.view-model.ts` with `toHttp` and `toHttpPage`.
3. One controller per endpoint.
4. `<ctx>-http.module.ts` importing `DatabaseModule`, listing controllers and use cases; import it in
   `presentations/http/http.module.ts`.
5. `test/e2e/<ctx>.e2e-spec.ts` covering every route: success, validation 400, domain errors, 401, someone else's
   resource (404), admin access.

## 5. Finish

- Add the routes to the API table in `README.md` (and `README.pt-BR.md`).
- Run `npm run lint:check`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`.
