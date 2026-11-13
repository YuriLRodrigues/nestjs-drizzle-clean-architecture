// Writes the OpenAPI document of the compiled app to a file, without a real database (PGlite).
//   npm run build && node tooling/export-openapi.mjs ../my-frontend/openapi.json
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(join(root, 'package.json'))
const { PGlite } = require('@electric-sql/pglite')
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket')

const output = resolve(process.argv[2] ?? 'openapi.json')
const DB_PORT = 55433
const APP_PORT = 39334
const base = `http://127.0.0.1:${APP_PORT}`

const db = await PGlite.create()
const server = new PGLiteSocketServer({ db, host: '127.0.0.1', port: DB_PORT, maxConnections: 2 })
await server.start()

const app = spawn(process.execPath, ['dist/main'], {
  cwd: root,
  env: {
    ...process.env,
    DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`,
    DATABASE_POOL_MAX: '1',
    JWT_SECRET: 'x'.repeat(40),
    PORT: String(APP_PORT),
    LOG_BANNER: 'off',
    LOG_FORMAT: 'json',
  },
  stdio: 'ignore',
})

try {
  let document
  for (let attempt = 0; attempt < 80 && !document; attempt++) {
    document = await fetch(`${base}/docs-json`)
      .then((response) => (response.ok ? response.json() : undefined))
      .catch(() => undefined)
    if (!document) await new Promise((done) => setTimeout(done, 250))
  }
  if (!document) throw new Error('the app did not answer /docs-json: run `npm run build` first')

  writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`)
  console.log(`OpenAPI document written to ${output}`)
} finally {
  app.kill()
  await server.stop()
  await db.close()
}
