import type { Role } from '@core/auth/actor'
import { AggregateRoot } from '@core/domain/aggregate-root'
import type { UniqueEntityId } from '@core/domain/unique-entity-id'
import type { Optional } from '@core/logic/optional'

import type { Email } from '../value-objects/email'

export type UserProps = {
  name: string
  email: Email
  passwordHash: string
  role: Role
  createdAt: Date
}

export class User extends AggregateRoot<UserProps> {
  get name(): string {
    return this.props.name
  }

  get email(): Email {
    return this.props.email
  }

  get passwordHash(): string {
    return this.props.passwordHash
  }

  get role(): Role {
    return this.props.role
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  static create(props: Optional<UserProps, 'role' | 'createdAt'>, id?: UniqueEntityId): User {
    return new User({ ...props, role: props.role ?? 'USER', createdAt: props.createdAt ?? new Date() }, id)
  }
}
