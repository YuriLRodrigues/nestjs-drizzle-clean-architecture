// Boots the compiled app (dist/main) against PGlite, calls a few routes and saves what the terminal showed.
// Used to regenerate the README images:  npm run build && node tooling/capture-terminal.mjs
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ansiToSvg } from './ansi-to-svg.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(join(root, 'package.json'))
const { PGlite } = require('@electric-sql/pglite')
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket')
const { runMigrations } = require(join(root, 'dist/infra/database/migrate.js'))

const DB_PORT = 55432
// Any free port: the capture shows the default one.
const APP_PORT = 39333
const base = `http://127.0.0.1:${APP_PORT}`

async function capture(theme) {
  const db = await PGlite.create()
  const server = new PGLiteSocketServer({ db, host: '127.0.0.1', port: DB_PORT, maxConnections: 4 })
  await server.start()
  const url = `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`
  await runMigrations(url)

  let output = ''
  const app = spawn(process.execPath, ['dist/main'], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DATABASE_URL: url,
      DATABASE_POOL_MAX: '1',
      JWT_SECRET: 'x'.repeat(40),
      PORT: String(APP_PORT),
      FORCE_COLOR: '3',
      LOG_BACKGROUND: theme,
      LOG_FORMAT: 'pretty',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  app.stdout.on('data', (chunk) => (output += chunk))
  app.stderr.on('data', (chunk) => (output += chunk))

  const call = async (method, path, body, token) => {
    const response = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body),
    })
    const text = await response.text()
    return { status: response.status, body: text ? JSON.parse(text) : null }
  }

  try {
    for (let attempt = 0; attempt < 80; attempt++) {
      const up = await fetch(`${base}/health`)
        .then((response) => response.ok)
        .catch(() => false)
      if (up) break
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    const account = { name: 'Ada', email: 'ada@example.com', password: 'secret123' }
    await call('POST', '/auth/sign-up', account)
    const signIn = await call('POST', '/auth/sign-in', { email: account.email, password: account.password })
    const token = signIn.body.accessToken
    const task = await call('POST', '/tasks', { title: 'Write the README' }, token)
    await call('GET', '/tasks?search=readme', undefined, token)
    await call('PATCH', `/tasks/${task.body.id}/complete`, undefined, token)
    await call('PATCH', `/tasks/${task.body.id}/complete`, undefined, token)
    await call('GET', '/users', undefined, token)
    await call('GET', '/tasks/not-a-uuid', undefined, token)
    await call('GET', '/me')
    await new Promise((resolve) => setTimeout(resolve, 300))
  } finally {
    app.kill()
    await server.stop()
    await db.close()
  }

  // The capture runs on a free port; the image shows the default one.
  return output.replaceAll(String(APP_PORT), '3333').replace(/\r/g, '').replace(/\n+$/, '').split('\n')
}

const assets = join(root, 'docs', 'assets')
mkdirSync(assets, { recursive: true })

for (const theme of ['dark', 'light']) {
  const lines = await capture(theme)
  const bannerEnd = lines.findIndex((line) => line.includes('pid '))
  writeFileSync(
    join(assets, `banner-${theme}.svg`),
    ansiToSvg(['', ...lines.slice(1, bannerEnd + 1), ''], { theme, title: 'npm run start:dev', minColumns: 72 }),
  )
  writeFileSync(
    join(assets, `terminal-${theme}.svg`),
    ansiToSvg(['', ...lines.slice(bannerEnd + 2), ''], { theme, title: 'npm run start:dev', minColumns: 96 }),
  )
  console.log(`${theme}: ${lines.length} lines`)
}
