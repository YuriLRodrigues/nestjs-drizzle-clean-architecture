import { Injectable } from '@nestjs/common'

import { type Either, left, right } from '@core/logic/either'

import { User } from '../../enterprise/entities/user.entity'
import { Email } from '../../enterprise/value-objects/email'
import { EmailAlreadyInUseError } from '../../errors/email-already-in-use.error'
import type { InvalidEmailError } from '../../errors/invalid-email.error'
import { HashGenerator } from '../cryptography/hash-generator'
import { UsersRepository } from '../repositories/users.repository'

export type RegisterUserInput = {
  name: string
  email: string
  password: string
}

export type RegisterUserOutput = Either<InvalidEmailError | EmailAlreadyInUseError, { user: User }>

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute({ name, email, password }: RegisterUserInput): Promise<RegisterUserOutput> {
    const emailOrError = Email.create(email)
    if (emailOrError.isLeft()) return left(emailOrError.value)

    if (await this.usersRepository.findByEmail(emailOrError.value)) {
      return left(new EmailAlreadyInUseError())
    }

    const user = User.create({
      name: name.trim(),
      email: emailOrError.value,
      passwordHash: await this.hashGenerator.hash(password),
    })

    await this.usersRepository.create(user)

    return right({ user })
  }
}
