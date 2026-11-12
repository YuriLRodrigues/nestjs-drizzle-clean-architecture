---
name: pattern-review
description: Review the current diff (or a given branch or files) of this NestJS + Drizzle template against its architecture rules - layers, Either, DomainError codes, view models, DTO vs domain validation, auth, listing contract, migrations and tests. Use before a commit or PR, or when the user asks to check code against the project's patterns.
---

# Pattern review

Review only what changed: `git diff` (staged + unstaged) by default, or `git diff <base>...HEAD` for a branch.
Read each changed file in full, not just the hunk.

## Checklist

**Layers**

- [ ] Nothing in `src/domain` or `src/core` imports `infra`, `presentations`, Drizzle, `pg`, bcrypt, JWT, Swagger or
      class-validator (`npm run lint:check` catches most; look for workarounds such as `eslint-disable`).
- [ ] No use case imports another use case.
- [ ] Use cases depend on abstract classes only; new ports are abstract classes in `applications/`.

**Use cases and errors**

- [ ] `execute()` returns `Either`; no `throw` for a business rule.
- [ ] Every failure is a `DomainError` with a new, stable `CONTEXT.REASON` code; no existing code renamed or reused
      with another meaning.
- [ ] Someone else's resource answers 404; credentials errors don't reveal which part was wrong.

**HTTP**

- [ ] One controller per endpoint; `handle` only calls, throws on `isLeft()` and maps a view model.
- [ ] No entity returned directly; no secret in a view model.
- [ ] DTOs validate shape only; business rules stay in the domain. `ParseUUIDPipe` on ids.
- [ ] Every route is private unless intentionally `@Public()`; `@Roles` or a policy where needed.
- [ ] Every possible error code is documented with an `@Api*Response`.
- [ ] Lists use `PaginationQueryDto` and return `{ results, meta }`.

**Persistence**

- [ ] Schema changes come with a generated migration in `drizzle/`; no hand-edited SQL.
- [ ] Mapper, in-memory repository and factory updated with the entity.
- [ ] Writes dispatch domain events after the write; subscribers catch their own errors.

**Tests**

- [ ] New pure code has a `*.unit.spec.ts`; new use cases have a `*.integration.spec.ts` covering every `Left`.
- [ ] New or changed routes are covered in `test/e2e/`.
- [ ] `npm run lint:check`, `npm run typecheck`, `npm test` and `npm run test:e2e` pass. Run them and report the
      output; do not assume.

## Report

List findings ordered by severity: what breaks a rule or a client first, style last. For each one give
`file:line`, the rule, why it matters and the concrete fix. Say explicitly when everything passes. Do not change code
unless the user asks for the fixes.
