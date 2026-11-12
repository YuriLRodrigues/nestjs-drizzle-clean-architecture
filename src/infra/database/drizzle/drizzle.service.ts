import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { EnvService } from '@infra/env/env.service'

/** Owns the connection pool. Repositories use `db`; nothing outside `infra/database` touches the pool. */
@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name)
  private readonly pool: Pool
  readonly db: NodePgDatabase

  constructor(env: EnvService) {
    this.pool = new Pool({ connectionString: env.get('DATABASE_URL'), max: env.get('DATABASE_POOL_MAX') })
    // Without an `error` listener, an idle connection dropped by the server crashes the process.
    this.pool.on('error', (error) => this.logger.error(`Idle database connection failed: ${error.message}`))
    this.db = drizzle({ client: this.pool })
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end()
  }
}
