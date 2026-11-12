import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { ListUsersUseCase } from '@domain/identity/applications/use-cases/list-users.use-case'

import { Roles } from '../../auth/roles.decorator'
import { ErrorResponseDto } from '../../errors/error-response.dto'
import { PaginationQueryDto } from '../../pagination/pagination-query.dto'
import { UsersPageResponseDto } from './dtos/user-response.dto'
import { UserViewModel } from './view-models/user.view-model'

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class ListUsersController {
  constructor(private readonly listUsers: ListUsersUseCase) {}

  @Get()
  @Roles('ADMIN')
  @ApiOkResponse({ type: UsersPageResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto, description: 'Not an admin.' })
  async handle(@Query() query: PaginationQueryDto): Promise<UsersPageResponseDto> {
    const result = await this.listUsers.execute({ page: query.page, limit: query.limit })

    return UserViewModel.toHttpPage(result.value.users)
  }
}
