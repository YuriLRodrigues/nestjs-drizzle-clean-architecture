import { beforeEach, describe, expect, it } from 'vitest'

import { FakeEncrypter } from '@test/cryptography/fake-encrypter'
import { FakeHasher } from '@test/cryptography/fake-hasher'
import { makeUser } from '@test/factories/make-user'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users.repository'

import { Email } from '../../enterprise/value-objects/email'
import { InvalidCredentialsError } from '../../errors/invalid-credentials.error'
import { AuthenticateUserUseCase } from './authenticate-user.use-case'

describe('AuthenticateUserUseCase', () => {
  let usersRepository: InMemoryUsersRepository
  let sut: AuthenticateUserUseCase

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    const hasher = new FakeHasher()
    sut = new AuthenticateUserUseCase(usersRepository, hasher, new FakeEncrypter())
  })

  it('returns an access token carrying the user id and role', async () => {
    const user = makeUser({ email: Email.restore('jane@example.com'), role: 'ADMIN' })
    usersRepository.items.push(user)

    const result = await sut.execute({ email: ' JANE@example.com', password: 'secret123' })

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) return
    expect(JSON.parse(result.value.accessToken)).toEqual({ sub: user.id.toString(), role: 'ADMIN' })
  })

  it('rejects a wrong password', async () => {
    usersRepository.items.push(makeUser({ email: Email.restore('jane@example.com') }))

    const result = await sut.execute({ email: 'jane@example.com', password: 'wrong-password' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCredentialsError)
  })

  it('rejects an unknown e-mail with the same error', async () => {
    const result = await sut.execute({ email: 'nobody@example.com', password: 'secret123' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCredentialsError)
  })

  it('rejects a malformed e-mail with the same error', async () => {
    const result = await sut.execute({ email: 'not-an-email', password: 'secret123' })

    expect(result.value).toBeInstanceOf(InvalidCredentialsError)
  })
})
