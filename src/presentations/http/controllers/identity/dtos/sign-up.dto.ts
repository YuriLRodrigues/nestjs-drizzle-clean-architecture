import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, Length, MaxLength, MinLength } from 'class-validator'

export class SignUpDto {
  @ApiProperty({ example: 'Jane Doe', minLength: 1, maxLength: 100 })
  @IsString()
  @Length(1, 100)
  name: string

  @ApiProperty({ example: 'jane@example.com', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email: string

  /** bcrypt only reads the first 72 bytes. */
  @ApiProperty({ example: 'secret123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string
}
