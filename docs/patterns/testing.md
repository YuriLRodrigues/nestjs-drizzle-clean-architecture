# Testing

## Three kinds, picked by file suffix

| Suffix                                     | Project       | What it tests                                         | Collaborators                 |
| ------------------------------------------ | ------------- | ----------------------------------------------------- | ----------------------------- |
| `*.unit.spec.ts` (next to the file)        | `unit`        | entities, value objects, policies, pure functions     | none                          |
| `*.integration.spec.ts` (next to the file) | `integration` | use cases, subscribers                                | in-memory repositories, fakes |
| `test/e2e/*.e2e-spec.ts`                   | `e2e`         | HTTP routes, guards, validation, Drizzle repositories | the real app and Postgres     |

```bash
npm test            # unit + integration (pre-commit runs the related ones)
npm run test:e2e    # e2e
npm run test:cov    # coverage of unit + integration
```

## Use case tests

No Nest module: instantiate the use case with in-memory repositories and fakes.

```ts
describe('CompleteTaskUseCase', () => {
  let tasksRepository: InMemoryTasksRepository
  let sut: CompleteTaskUseCase

  beforeEach(() => {
    tasksRepository = new InMemoryTasksRepository()
    sut = new CompleteTaskUseCase(tasksRepository)
  })

  it('refuses to complete a task twice', async () => {
    const task = makeTask({ ownerId: new UniqueEntityId('owner-1') })
    tasksRepository.items.push(task)
    const actor = { id: 'owner-1', role: 'USER' as const }

    await sut.execute({ actor, taskId: task.id.toString() })
    const result = await sut.execute({ actor, taskId: task.id.toString() })

    expect(result.value).toBeInstanceOf(TaskAlreadyCompletedError)
  })
})
```

- `sut` (system under test) is the use case.
- Cover the happy path and **every `Left`** the use case declares.
- Seed with `make*` factories (`test/factories/`); override only what the test is about.
- Fakes (`test/cryptography/`) are deterministic: `FakeHasher.hash('secret123') === 'hashed:secret123'`.
- Tests that register event handlers clear them in `afterEach` (`DomainEvents.clearHandlers()`).

## E2E tests

`test/e2e/global-setup.ts` prepares one migrated database for the run:

- with `DATABASE_URL` (docker compose, CI): creates `e2e_<timestamp>` on that server and drops it at the end;
- without it: starts PGlite (Postgres in WASM) on a local port. No Docker needed.

Each spec boots the real `AppModule` with `createTestApp()` and creates its own accounts with `createAccount(app)`
(unique e-mails), so specs don't depend on each other. `createAccount(app, 'ADMIN')` promotes the account directly in
the database. Specs run one file at a time.

## TDD loop

1. Write the failing test for one behaviour.
2. Run it and watch it fail for the right reason.
3. Write the least code that makes it pass.
4. Refactor with the tests green.
