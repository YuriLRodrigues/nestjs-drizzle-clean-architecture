import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { GetUserProfileUseCase } from '@domain/identity/applications/use-cases/get-user-profile.use-case'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ErrorResponseDto } from '../../errors/error-response.dto'
import { UserResponseDto } from './dtos/user-response.dto'
import { UserViewModel } from './view-models/user.view-model'

@ApiTags('auth')
@ApiBearerAuth()
@Controller('me')
export class GetMeController {
  constructor(private readonly getUserProfile: GetUserProfileUseCase) {}

  @Get()
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: '`USER.NOT_FOUND` (account deleted after sign-in)' })
  async handle(@CurrentActor() actor: Actor): Promise<UserResponseDto> {
    const result = await this.getUserProfile.execute({ userId: actor.id })

    if (result.isLeft()) throw result.value

    return UserViewModel.toHttp(result.value.user)
  }
}
