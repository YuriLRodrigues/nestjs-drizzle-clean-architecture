import { describe, expect, it } from 'vitest'

import { parseEnv } from './env'

const valid = {
  DATABASE_URL: 'postgresql://app:app@localhost:5432/app',
  JWT_SECRET: 'a'.repeat(32),
}

describe('parseEnv', () => {
  it('applies the defaults', () => {
    expect(parseEnv(valid)).toEqual({
      ...valid,
      NODE_ENV: 'development',
      PORT: 3333,
      DATABASE_POOL_MAX: 10,
      JWT_EXPIRES_IN_SECONDS: 3600,
    })
  })

  it('coerces numbers', () => {
    expect(parseEnv({ ...valid, PORT: '8080' }).PORT).toBe(8080)
  })

  it('lists every invalid variable', () => {
    expect(() => parseEnv({ DATABASE_URL: 'mysql://localhost', JWT_SECRET: 'short' })).toThrow(
      /DATABASE_URL[\s\S]*JWT_SECRET/,
    )
  })
})
