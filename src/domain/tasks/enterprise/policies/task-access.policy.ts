import { type Actor, isAdmin } from '@core/auth/actor'

import type { Task } from '../entities/task.entity'

/** A task is visible to its owner and to admins. Pure, so every use case applies the same rule. */
export function canAccessTask(actor: Actor, task: Task): boolean {
  return isAdmin(actor) || task.ownerId.toString() === actor.id
}
