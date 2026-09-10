import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@artisan/database';

export class ProfileResponseDto {
  @ApiProperty({ example: '8fd4f6e9-9549-49c7-90e3-19caa9816141' })
  id!: string;

  @ApiProperty({ example: '8fd4f6e9-9549-49c7-90e3-19caa9816141' })
  userId!: string;

  @ApiProperty({ example: 'Sunita Devi' })
  fullName!: string;

  @ApiPropertyOptional({ example: 'Mithila Folk Heritage Creations' })
  businessName?: string | null;

  @ApiPropertyOptional({ example: 'Madhubani Hand Painting' })
  craftType?: string | null;

  @ApiPropertyOptional({ example: 'Madhubani' })
  region?: string | null;

  @ApiPropertyOptional({ example: 'Bihar' })
  state?: string | null;

  @ApiProperty({ example: 'hi' })
  preferredLanguage!: string;

  @ApiPropertyOptional({ example: '3rd generation artisan...' })
  bio?: string | null;

  @ApiPropertyOptional({ example: 'https://...' })
  avatarUrl?: string | null;

  @ApiProperty({ example: '2026-09-08T22:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-08T22:00:00.000Z' })
  updatedAt!: Date;
}

export class UserResponseDto {
  @ApiProperty({ example: '8fd4f6e9-9549-49c7-90e3-19caa9816141' })
  id!: string;

  @ApiPropertyOptional({ example: 'sunita.devi@example.com' })
  email?: string | null;

  @ApiPropertyOptional({ example: '+919876543210' })
  phone?: string | null;

  @ApiProperty({ enum: UserRole, isArray: true, example: [UserRole.ARTISAN] })
  roles!: UserRole[];

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ type: () => ProfileResponseDto })
  profile?: ProfileResponseDto | null;

  @ApiProperty({ example: '2026-09-08T22:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-08T22:00:00.000Z' })
  updatedAt!: Date;
}
