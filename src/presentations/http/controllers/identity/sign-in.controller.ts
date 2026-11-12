import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { AuthenticateUserUseCase } from '@domain/identity/applications/use-cases/authenticate-user.use-case'

import { Public } from '../../auth/public.decorator'
import { ErrorResponseDto } from '../../errors/error-response.dto'
import { AccessTokenResponseDto } from './dtos/access-token-response.dto'
import { SignInDto } from './dtos/sign-in.dto'

@ApiTags('auth')
@Controller('auth/sign-in')
export class SignInController {
  constructor(private readonly authenticateUser: AuthenticateUserUseCase) {}

  @Post()
  @Public()
  @HttpCode(200)
  @ApiOkResponse({ type: AccessTokenResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: '`AUTH.INVALID_CREDENTIALS`' })
  async handle(@Body() body: SignInDto): Promise<AccessTokenResponseDto> {
    const result = await this.authenticateUser.execute(body)

    if (result.isLeft()) throw result.value

    return { accessToken: result.value.accessToken }
  }
}
