import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  uuid!: string;

  @ApiProperty({ example: 'mayank@example.com' })
  email!: string;

  @ApiProperty({ example: '2026-04-14T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-04-14T10:00:00.000Z' })
  updatedAt!: Date;
}