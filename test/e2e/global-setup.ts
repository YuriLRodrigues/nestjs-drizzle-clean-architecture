import { createServer } from 'node:net'

import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { Pool } from 'pg'
import type { TestProject } from 'vitest/node'

import { runMigrations } from '../../src/infra/database/migrate'

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string
    databasePoolMax: number
  }
}

/**
 * Gives the e2e run a migrated, empty Postgres and removes it afterwards:
 * - with DATABASE_URL (docker compose, CI): a new database `e2e_<timestamp>` on that server;
 * - without it: PGlite (Postgres compiled to WASM) behind a local socket, so no Docker is needed.
 */
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const serverUrl = process.env.DATABASE_URL

  if (serverUrl) {
    const name = `e2e_${Date.now()}`
    const admin = new Pool({ connectionString: serverUrl, max: 1 })
    await admin.query(`CREATE DATABASE "${name}"`)

    const url = new URL(serverUrl)
    url.pathname = `/${name}`
    await runMigrations(url.toString())

    project.provide('databaseUrl', url.toString())
    project.provide('databasePoolMax', 5)

    return async () => {
      await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`)
      await admin.end()
    }
  }

  const db = await PGlite.create()
  const port = await freePort()
  const server = new PGLiteSocketServer({ db, host: '127.0.0.1', port, maxConnections: 4 })
  await server.start()

  // PGlite is a single session: one connection per pool keeps statements from different requests apart.
  const url = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`
  await runMigrations(url)

  project.provide('databaseUrl', url)
  project.provide('databasePoolMax', 1)

  return async () => {
    await server.stop()
    await db.close()
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      probe.close(() => (typeof address === 'object' && address ? resolve(address.port) : reject(new Error('no port'))))
    })
  })
}
