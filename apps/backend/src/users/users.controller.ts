import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto, ProfileResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Fetch current authenticated user & artisan profile',
    description:
      'Returns the user account and linked profile for the authenticated artisan. Auto-provisions user on first login.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile retrieved successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Supabase JWT authentication token.',
  })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getCurrentUser(user);
  }

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new artisan profile',
    description:
      'Creates the 1:1 Profile record for the authenticated user, capturing full name, craft brand, cluster region, and language.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Artisan profile created successfully.',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed for submitted profile fields.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Artisan profile already exists for this user ID.',
  })
  async createProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProfileDto,
  ) {
    return this.usersService.createProfile(user, dto);
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Update existing artisan profile',
    description:
      'Partially updates artisan attributes such as preferred language, craft type, bio, or contact details.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully.',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No existing profile found for this user. Create one first.',
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}
