import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { Public } from '../../auth/public.decorator'

/** Liveness probe for Docker and orchestrators. */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  handle(): { status: 'ok' } {
    return { status: 'ok' }
  }
}
