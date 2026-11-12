import { index, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

// Relative import on purpose: drizzle-kit loads this file outside of Nest and does not read tsconfig paths.
import { taskStatuses } from '../../../../domain/tasks/enterprise/task-status'
import { users } from './users'

export const taskStatusEnum = pgEnum('task_status', taskStatuses)

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description'),
    status: taskStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [index('tasks_owner_id_created_at_idx').on(table.ownerId, table.createdAt.desc())],
)

export type TaskRow = typeof tasks.$inferSelect
export type NewTaskRow = typeof tasks.$inferInsert
