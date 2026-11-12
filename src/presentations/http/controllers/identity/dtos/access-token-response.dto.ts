import { ApiProperty } from '@nestjs/swagger'

export class AccessTokenResponseDto {
  @ApiProperty({ description: 'Send it as `Authorization: Bearer <accessToken>`.' })
  accessToken: string
}
