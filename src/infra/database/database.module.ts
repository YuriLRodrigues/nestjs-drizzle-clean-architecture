import { Module } from '@nestjs/common'

import { UsersRepository } from '@domain/identity/applications/repositories/users.repository'
import { TasksRepository } from '@domain/tasks/applications/repositories/tasks.repository'

import { DrizzleService } from './drizzle/drizzle.service'
import { DrizzleTasksRepository } from './drizzle/repositories/drizzle-tasks.repository'
import { DrizzleUsersRepository } from './drizzle/repositories/drizzle-users.repository'

/** Binds each abstract repository (the DI token the use cases ask for) to its Drizzle implementation. */
@Module({
  providers: [
    DrizzleService,
    { provide: UsersRepository, useClass: DrizzleUsersRepository },
    { provide: TasksRepository, useClass: DrizzleTasksRepository },
  ],
  exports: [DrizzleService, UsersRepository, TasksRepository],
})
export class DatabaseModule {}
