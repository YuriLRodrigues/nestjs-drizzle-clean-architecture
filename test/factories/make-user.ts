import { randomUUID } from 'node:crypto'

import type { UniqueEntityId } from '@core/domain/unique-entity-id'
import { User, type UserProps } from '@domain/identity/enterprise/entities/user.entity'
import { Email } from '@domain/identity/enterprise/value-objects/email'

/** A valid user with a unique e-mail. The password hash matches `FakeHasher` for the password `secret123`. */
export function makeUser(override: Partial<UserProps> = {}, id?: UniqueEntityId): User {
  return User.create(
    {
      name: 'Jane Doe',
      email: Email.restore(`user-${randomUUID()}@example.com`),
      passwordHash: 'hashed:secret123',
      ...override,
    },
    id,
  )
}
