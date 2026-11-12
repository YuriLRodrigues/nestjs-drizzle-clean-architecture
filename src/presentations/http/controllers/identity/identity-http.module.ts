import { Module } from '@nestjs/common'

import { AuthenticateUserUseCase } from '@domain/identity/applications/use-cases/authenticate-user.use-case'
import { GetUserProfileUseCase } from '@domain/identity/applications/use-cases/get-user-profile.use-case'
import { ListUsersUseCase } from '@domain/identity/applications/use-cases/list-users.use-case'
import { RegisterUserUseCase } from '@domain/identity/applications/use-cases/register-user.use-case'
import { CryptographyModule } from '@infra/cryptography/cryptography.module'
import { DatabaseModule } from '@infra/database/database.module'

import { GetMeController } from './get-me.controller'
import { ListUsersController } from './list-users.controller'
import { SignInController } from './sign-in.controller'
import { SignUpController } from './sign-up.controller'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [SignUpController, SignInController, GetMeController, ListUsersController],
  providers: [RegisterUserUseCase, AuthenticateUserUseCase, GetUserProfileUseCase, ListUsersUseCase],
})
export class IdentityHttpModule {}
