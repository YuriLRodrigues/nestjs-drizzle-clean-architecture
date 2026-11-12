import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, ilike, or } from 'drizzle-orm'

import { DomainEvents } from '@core/events/domain-events'
import { offsetOf, type Paginated, paginated } from '@core/pagination/pagination'
import type { FindManyTasksParams, TasksRepository } from '@domain/tasks/applications/repositories/tasks.repository'
import type { Task } from '@domain/tasks/enterprise/entities/task.entity'

import { DrizzleService } from '../drizzle.service'
import { containsPattern } from '../like-pattern'
import { TaskMapper } from '../mappers/task.mapper'
import { tasks } from '../schema/tasks'

@Injectable()
export class DrizzleTasksRepository implements TasksRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<Task | null> {
    const [row] = await this.drizzle.db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
    return row ? TaskMapper.toDomain(row) : null
  }

  async findMany({ ownerId, status, search, ...params }: FindManyTasksParams): Promise<Paginated<Task>> {
    const where = and(
      ownerId ? eq(tasks.ownerId, ownerId) : undefined,
      status ? eq(tasks.status, status) : undefined,
      search ? or(ilike(tasks.title, containsPattern(search)), ilike(tasks.description, containsPattern(search))) : undefined,
    )

    const [rows, [{ total }]] = await Promise.all([
      this.drizzle.db
        .select()
        .from(tasks)
        .where(where)
        .orderBy(desc(tasks.createdAt), desc(tasks.id))
        .limit(params.limit)
        .offset(offsetOf(params)),
      this.drizzle.db.select({ total: count() }).from(tasks).where(where),
    ])

    return paginated(
      rows.map((row) => TaskMapper.toDomain(row)),
      total,
      params,
    )
  }

  async create(task: Task): Promise<void> {
    await this.drizzle.db.insert(tasks).values(TaskMapper.toPersistence(task))
    await DomainEvents.dispatchEventsForAggregate(task.id)
  }

  async save(task: Task): Promise<void> {
    const { id, ...changes } = TaskMapper.toPersistence(task)

    await this.drizzle.db.update(tasks).set(changes).where(eq(tasks.id, id))
    await DomainEvents.dispatchEventsForAggregate(task.id)
  }

  async delete(task: Task): Promise<void> {
    await this.drizzle.db.delete(tasks).where(eq(tasks.id, task.id.toString()))
    await DomainEvents.dispatchEventsForAggregate(task.id)
  }
}
