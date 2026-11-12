import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'

import { RegisterUserUseCase } from '@domain/identity/applications/use-cases/register-user.use-case'

import { Public } from '../../auth/public.decorator'
import { ErrorResponseDto } from '../../errors/error-response.dto'
import { SignUpDto } from './dtos/sign-up.dto'
import { UserResponseDto } from './dtos/user-response.dto'
import { UserViewModel } from './view-models/user.view-model'

@ApiTags('auth')
@Controller('auth/sign-up')
export class SignUpController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

  @Post()
  @Public()
  @HttpCode(201)
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: '`VALIDATION.FAILED`' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: '`USER.EMAIL_IN_USE`' })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto, description: '`USER.INVALID_EMAIL`' })
  async handle(@Body() body: SignUpDto): Promise<UserResponseDto> {
    const result = await this.registerUser.execute(body)

    if (result.isLeft()) throw result.value

    return UserViewModel.toHttp(result.value.user)
  }
}
