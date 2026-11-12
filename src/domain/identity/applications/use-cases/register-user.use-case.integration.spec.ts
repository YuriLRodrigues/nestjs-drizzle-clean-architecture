import { beforeEach, describe, expect, it } from 'vitest'

import { FakeHasher } from '@test/cryptography/fake-hasher'
import { makeUser } from '@test/factories/make-user'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users.repository'

import { Email } from '../../enterprise/value-objects/email'
import { EmailAlreadyInUseError } from '../../errors/email-already-in-use.error'
import { InvalidEmailError } from '../../errors/invalid-email.error'
import { RegisterUserUseCase } from './register-user.use-case'

describe('RegisterUserUseCase', () => {
  let usersRepository: InMemoryUsersRepository
  let sut: RegisterUserUseCase

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new RegisterUserUseCase(usersRepository, new FakeHasher())
  })

  it('registers a user with a hashed password and the USER role', async () => {
    const result = await sut.execute({ name: ' Jane Doe ', email: 'Jane@Example.com', password: 'secret123' })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.items).toHaveLength(1)

    const [user] = usersRepository.items
    expect(user.name).toBe('Jane Doe')
    expect(user.email.value).toBe('jane@example.com')
    expect(user.passwordHash).toBe('hashed:secret123')
    expect(user.role).toBe('USER')
  })

  it('rejects an e-mail that is already registered, whatever the case', async () => {
    usersRepository.items.push(makeUser({ email: Email.restore('jane@example.com') }))

    const result = await sut.execute({ name: 'Jane', email: 'JANE@example.com', password: 'secret123' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmailAlreadyInUseError)
    expect(usersRepository.items).toHaveLength(1)
  })

  it('rejects an invalid e-mail', async () => {
    const result = await sut.execute({ name: 'Jane', email: 'not-an-email', password: 'secret123' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidEmailError)
    expect(usersRepository.items).toHaveLength(0)
  })
})
