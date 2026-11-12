import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'

import type { EventHandler } from '@core/events/event-handler'
import { DomainEvents } from '@core/events/domain-events'
import { TaskCompletedEvent } from '@domain/tasks/enterprise/events/task-completed.event'

/**
 * Example side effect of `TaskCompletedEvent`. Replace the log with a notification, an e-mail or a queue job.
 * It catches its own errors: a failing side effect must not fail the request that completed the task.
 */
@Injectable()
export class OnTaskCompleted implements EventHandler, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OnTaskCompleted.name)
  private unregister?: () => void

  onModuleInit(): void {
    this.setupSubscriptions()
  }

  onModuleDestroy(): void {
    this.unregister?.()
  }

  setupSubscriptions(): void {
    this.unregister = DomainEvents.register<TaskCompletedEvent>((event) => this.handle(event), TaskCompletedEvent.name)
  }

  private handle({ task }: TaskCompletedEvent): void {
    try {
      this.logger.log(`Task ${task.id.toString()} completed by owner ${task.ownerId.toString()}`)
    } catch (error) {
      this.logger.error(`Could not handle TaskCompletedEvent for task ${task.id.toString()}`, error)
    }
  }
}
