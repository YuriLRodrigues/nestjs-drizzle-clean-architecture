import { DomainEvents } from '@core/events/domain-events'
import { offsetOf, type Paginated, paginated } from '@core/pagination/pagination'
import type { FindManyTasksParams, TasksRepository } from '@domain/tasks/applications/repositories/tasks.repository'
import type { Task } from '@domain/tasks/enterprise/entities/task.entity'

/** Same contract as the Drizzle repository, including the search rule and the event dispatch. */
export class InMemoryTasksRepository implements TasksRepository {
  items: Task[] = []

  async findById(id: string): Promise<Task | null> {
    return this.items.find((task) => task.id.toString() === id) ?? null
  }

  async findMany(params: FindManyTasksParams): Promise<Paginated<Task>> {
    const search = params.search?.toLowerCase()

    const matching = this.items
      .filter((task) => !params.ownerId || task.ownerId.toString() === params.ownerId)
      .filter((task) => !params.status || task.status === params.status)
      .filter(
        (task) =>
          !search ||
          task.title.value.toLowerCase().includes(search) ||
          (task.description ?? '').toLowerCase().includes(search),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const offset = offsetOf(params)

    return paginated(matching.slice(offset, offset + params.limit), matching.length, params)
  }

  async create(task: Task): Promise<void> {
    this.items.push(task)
    await DomainEvents.dispatchEventsForAggregate(task.id)
  }

  async save(task: Task): Promise<void> {
    this.items = this.items.map((current) => (current.id.equals(task.id) ? task : current))
    await DomainEvents.dispatchEventsForAggregate(task.id)
  }

  async delete(task: Task): Promise<void> {
    this.items = this.items.filter((current) => !current.id.equals(task.id))
    await DomainEvents.dispatchEventsForAggregate(task.id)
  }
}
