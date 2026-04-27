import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'mayank@example.com',
    description: 'Unique email address of the user',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'User password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}