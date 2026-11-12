---
name: new-migration
description: Change the database in this NestJS + Drizzle template - edit the Drizzle schema, generate the migration with drizzle-kit, review the SQL and keep mappers, entities, in-memory repositories and tests in sync. Use for any new table, column, index, enum value or constraint.
---

# New migration

Migrations are **generated, never written or edited by hand**. The schema in
`src/infra/database/drizzle/schema/` is the source of truth.

## Steps

1. **Change the schema file** (one table per file). Follow `docs/patterns/database-and-migrations.md`:
   `snake_case` column names, `timestamp(..., { withTimezone: true })`, enums from the domain's `as const` list,
   relative imports only, an index for every list's `where` + `order by`.
2. **New column on an existing table**: decide how existing rows get a value. Either nullable, or `.default(...)`,
   or a two-step change (nullable now, backfill, `notNull()` in a later migration). Ask the user when unsure.
3. **Generate**: `npm run db:generate -- --name <kebab-description>` (for example `add-task-due-date`).
4. **Read the SQL** in `drizzle/<timestamp>_<name>/migration.sql` and tell the user what it does. Watch for:
   - a rename that came out as `DROP COLUMN` + `ADD COLUMN` (data loss): fix it by answering drizzle-kit's rename
     prompt, or ask the user;
   - `NOT NULL` without a default on a table that has rows;
   - enum values removed (Postgres cannot drop an enum value in place).

   If the SQL is wrong, change the schema and generate again. Delete only a migration you generated in this session
   and that was never applied anywhere.

5. **Keep the layers in sync**: entity props and `create()` defaults, the mapper (`toDomain`/`toPersistence`), the
   in-memory repository, the factory, DTOs and view model if the field is exposed.
6. **Verify**: `npm run typecheck`, `npm test`, `npm run test:e2e` (it applies every migration to a fresh database).
7. Applying to a shared or production database is the user's call: say which command (`npm run db:migrate` or
   `node dist/infra/database/migrate`) and against which `DATABASE_URL`, and do not run it yourself.
