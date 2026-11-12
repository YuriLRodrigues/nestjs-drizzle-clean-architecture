import { Injectable } from '@nestjs/common'

import { type Either, left, right } from '@core/logic/either'

import { Email } from '../../enterprise/value-objects/email'
import { InvalidCredentialsError } from '../../errors/invalid-credentials.error'
import { Encrypter } from '../cryptography/encrypter'
import { HashComparer } from '../cryptography/hash-comparer'
import { UsersRepository } from '../repositories/users.repository'

export type AuthenticateUserInput = {
  email: string
  password: string
}

export type AuthenticateUserOutput = Either<InvalidCredentialsError, { accessToken: string }>

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashComparer: HashComparer,
    private readonly encrypter: Encrypter,
  ) {}

  async execute({ email, password }: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    const emailOrError = Email.create(email)
    if (emailOrError.isLeft()) return left(new InvalidCredentialsError())

    const user = await this.usersRepository.findByEmail(emailOrError.value)
    if (!user) return left(new InvalidCredentialsError())

    if (!(await this.hashComparer.compare(password, user.passwordHash))) {
      return left(new InvalidCredentialsError())
    }

    const accessToken = await this.encrypter.encrypt({ sub: user.id.toString(), role: user.role })

    return right({ accessToken })
  }
}
