# nestjs-drizzle-clean-architecture

[![CI](https://github.com/YuriLRodrigues/nestjs-drizzle-clean-architecture/actions/workflows/ci.yml/badge.svg)](https://github.com/YuriLRodrigues/nestjs-drizzle-clean-architecture/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%3E%3D24-339933)
![License](https://img.shields.io/badge/license-MIT-blue)

> 🇧🇷 [Leia em português](./README.md)

A **NestJS + Drizzle ORM** backend template with Clean Architecture and DDD building blocks, strict lint that enforces
the layers, git hooks, end-to-end tests against a real Postgres and **Claude Code skills** that know the patterns.

It ships two bounded contexts as executable examples: **identity** (sign-up, sign-in with JWT, roles) and **tasks**
(CRUD, paginated search, ownership rules, a domain event). Keep them, adapt them or delete them.

## Features

- **Layered architecture**: `core` → `domain` → `infra` / `presentations`, with the dependency rule **enforced by
  ESLint**: the domain cannot import Drizzle, Nest JWT or the HTTP layer, and a use case cannot import another one.
- **Use cases return `Either`**, never throw for business rules. Every error has a stable `code` (`TASK.NOT_FOUND`)
  and one response shape: `{ statusCode, code, message, details? }`.
- **Abstract classes as DI tokens**: the use case asks for `TasksRepository`; infra binds the Drizzle implementation,
  tests use the in-memory one.
- **Entities, value objects, aggregates and domain events** with no framework inside.
- **Auth**: global JWT guard (`@Public()` to opt out), `@Roles('ADMIN')`, `@CurrentActor()`.
- **Drizzle ORM 1.0** with generated migrations and a programmatic migrator for production.
- **Tests in three layers**: unit (`*.unit.spec.ts`), integration with in-memory repositories
  (`*.integration.spec.ts`) and e2e over HTTP against Postgres, with **no Docker required** (PGlite).
- **Quality gates**: ESLint (type-checked) + Prettier, husky (`pre-commit` runs lint-staged and related tests,
  `commit-msg` runs commitlint), GitHub Actions CI.
- **Swagger** at `/docs`, health check at `/health`, zod-validated environment, multi-stage Dockerfile.
- **Claude Code ready**: `CLAUDE.md` plus skills to scaffold a module, a use case, a migration and to review a diff
  against the patterns.

## Quick start

Requirements: Node 24+, and Docker (or any Postgres) to run the app.

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run start:dev
```

Open <http://localhost:3333/docs>, call `POST /auth/sign-up`, then `POST /auth/sign-in` and click **Authorize** with
the `accessToken`.

The e2e tests do **not** need Docker: without `DATABASE_URL` they start PGlite (Postgres compiled to WASM) in-process.

## Scripts

| Script                                 | What it does                                                             |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `npm run start:dev`                    | Starts the API in watch mode                                             |
| `npm run build` / `npm run start:prod` | Compiles to `dist/` / runs the compiled app                              |
| `npm test`                             | Unit + integration tests                                                 |
| `npm run test:e2e`                     | E2E over HTTP (uses `DATABASE_URL` if set, PGlite otherwise)             |
| `npm run test:cov`                     | Unit + integration with coverage                                         |
| `npm run lint` / `npm run lint:check`  | ESLint with / without `--fix`                                            |
| `npm run typecheck`                    | `tsc --noEmit`                                                           |
| `npm run db:generate`                  | Generates a migration from the schema diff (never write one by hand)     |
| `npm run db:migrate`                   | Applies pending migrations (drizzle-kit, development)                    |
| `npm run db:migrate:prod`              | Applies pending migrations with the compiled migrator (production image) |
| `npm run db:studio`                    | Opens Drizzle Studio                                                     |

## Project structure

```
src/
├── core/                    # framework-free building blocks
│   ├── domain/              # Entity, AggregateRoot, ValueObject, UniqueEntityId
│   ├── events/              # DomainEvent, DomainEvents (in-process bus)
│   ├── errors/              # DomainError (code + httpStatus)
│   ├── logic/               # Either, Optional
│   ├── auth/                # Actor, roles
│   └── pagination/          # { results, meta }
├── domain/<context>/
│   ├── enterprise/          # entities, value objects, events, policies
│   ├── applications/        # use cases + abstract repositories/gateways (DI tokens)
│   └── errors/              # the context's DomainErrors
├── infra/
│   ├── env/                 # zod schema + EnvService
│   ├── database/            # Drizzle schema, mappers, repositories, migrator
│   ├── cryptography/        # bcrypt, JWT
│   └── events/              # subscribers of domain events
├── presentations/http/
│   ├── controllers/<context>/  # one controller per endpoint, DTOs, view models, module
│   ├── auth/                # AuthGuard, RolesGuard, @Public, @Roles, @CurrentActor
│   └── errors/              # the global error filter
test/
├── factories/               # makeUser(), makeTask()
├── repositories/            # in-memory repositories
├── cryptography/            # fakes
└── e2e/                     # global setup (Postgres/PGlite) + HTTP specs
```

## How a request flows

```
HTTP → AuthGuard → RolesGuard → ValidationPipe (DTO) → Controller
     → UseCase.execute() → Either
         ├─ Left(DomainError)  → controller throws it → HttpErrorFilter → { statusCode, code, message }
         └─ Right(value)       → ViewModel.toHttp() → JSON
UseCase → abstract Repository → (Nest DI) → DrizzleRepository → Postgres
                                              └─ after the write: DomainEvents → subscribers
```

## The rules that matter

1. A use case returns `Either<DomainError, T>`; it never throws for a business rule.
2. A controller has three useful lines: call the use case, throw on `isLeft()`, map the view model.
3. The abstract repository is the DI token. Abstract class in `domain`, `useClass` in `infra`, in-memory in tests.
4. An entity never leaves through HTTP: always a view model in between.
5. Every business error is a `DomainError` with a stable `code`.
6. One file, one responsibility: one use case, one controller per endpoint, one table per schema file.
7. Tests are born with the code, with in-memory repositories and `make*` factories, without a Nest module.

Details and examples in [`docs/architecture.md`](./docs/architecture.md) and [`docs/patterns/`](./docs/patterns).

## API

| Method   | Route                 | Auth    | Description                                                           |
| -------- | --------------------- | ------- | --------------------------------------------------------------------- |
| `POST`   | `/auth/sign-up`       | public  | Create an account (`USER`)                                            |
| `POST`   | `/auth/sign-in`       | public  | Get an access token                                                   |
| `GET`    | `/me`                 | bearer  | The signed-in user                                                    |
| `GET`    | `/users`              | `ADMIN` | Paginated list of users                                               |
| `POST`   | `/tasks`              | bearer  | Create a task                                                         |
| `GET`    | `/tasks`              | bearer  | Your tasks (`ADMIN`: everyone's): `page`, `limit`, `search`, `status` |
| `GET`    | `/tasks/:id`          | bearer  | One task                                                              |
| `PATCH`  | `/tasks/:id`          | bearer  | Change title/description (`description: null` clears)                 |
| `PATCH`  | `/tasks/:id/complete` | bearer  | Complete a task (raises `TaskCompletedEvent`)                         |
| `DELETE` | `/tasks/:id`          | bearer  | Delete a task                                                         |
| `GET`    | `/health`             | public  | Liveness probe                                                        |

## Claude Code

`CLAUDE.md` describes the architecture and the conventions, and `.claude/skills/` has project skills:

| Skill            | Use it to                                                                              |
| ---------------- | -------------------------------------------------------------------------------------- |
| `new-module`     | Scaffold a whole bounded context (entity, repository, use cases, Drizzle, HTTP, tests) |
| `new-use-case`   | Add one use case with its spec, controller, DTOs, view model and Swagger               |
| `new-migration`  | Change the Drizzle schema and generate the migration                                   |
| `pattern-review` | Review a diff against the rules above                                                  |

`skills-lock.json` also pins the community skill
[`nestjs-best-practices`](https://github.com/Kadajett/agent-nestjs-skills) (third party, not vendored). Install it with
`npx skills add Kadajett/agent-nestjs-skills`.

## Using it as a template

1. Click **Use this template** on GitHub (or clone it) and rename the package in `package.json`.
2. Keep `identity` if you need accounts. Delete `tasks` (domain, infra mappers/repositories/schema, controllers,
   tests) or use it as the model for your first context.
3. Change the schema and run `npm run db:generate` to create your first migration.
4. Run `/new-module` in Claude Code for each new bounded context.

## Out of scope (good next steps)

Refresh tokens, password reset, e-mail, file uploads, cache, queues and structured logging are not included on
purpose: each project picks its own provider. The layers make each one an adapter in `infra` behind an abstract class
in `domain`.

## License

[MIT](./LICENSE)
