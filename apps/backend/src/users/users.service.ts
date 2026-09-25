import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UserRepository } from './users.repository';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Profile, User, UserRole } from '@artisan/database';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Fetch current user details with attached artisan profile.
   * Synchronizes user from Supabase JWT if first login.
   */
  async getCurrentUser(
    authenticatedUser: AuthenticatedUser,
  ): Promise<User & { profile: Profile | null }> {
    const roles = (authenticatedUser.roles as UserRole[]) || [UserRole.ARTISAN];

    // Ensure user record exists in our database matching Supabase Auth UUID
    await this.userRepository.ensureUserExists(
      authenticatedUser.id,
      authenticatedUser.email,
      authenticatedUser.phone,
      roles,
    );

    const userWithProfile = await this.userRepository.findById(authenticatedUser.id);
    if (!userWithProfile) {
      throw new NotFoundException(`User with ID ${authenticatedUser.id} not found.`);
    }

    return userWithProfile;
  }

  /**
   * Create a new profile for the authenticated artisan.
   */
  async createProfile(
    authenticatedUser: AuthenticatedUser,
    dto: CreateProfileDto,
  ): Promise<Profile> {
    const roles = dto.role
      ? [dto.role as UserRole]
      : (authenticatedUser.roles as UserRole[]) || [UserRole.ARTISAN];

    // Ensure the parent user record is in place
    await this.userRepository.ensureUserExists(
      authenticatedUser.id,
      authenticatedUser.email,
      dto.phone || authenticatedUser.phone,
      roles,
    );

    // Verify if profile already exists
    const existingProfile = await this.userRepository.findProfileByUserId(
      authenticatedUser.id,
    );
    if (existingProfile) {
      throw new ConflictException(
        'Artisan profile already exists. Use PATCH /users/profile to modify profile attributes.',
      );
    }

    // Save the phone given at onboarding if no other account owns it
    const phone = dto.phone?.trim();
    if (phone) {
      const owner = await this.userRepository.findByPhone(phone);
      if (!owner) {
        await this.userRepository.updateUserPhone(authenticatedUser.id, phone);
      }
    }

    this.logger.log(`Creating profile for artisan user ID: ${authenticatedUser.id}`);
    return this.userRepository.createProfile(authenticatedUser.id, dto);
  }

  /**
   * Update an existing artisan profile.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const existingProfile = await this.userRepository.findProfileByUserId(userId);
    if (!existingProfile) {
      throw new NotFoundException(
        'Artisan profile not found. Please create a profile using POST /users/profile first.',
      );
    }

    // Phone lives on the user row and is unique; blank clears it
    if (dto.phone !== undefined) {
      const phone = dto.phone.trim() || null;
      if (phone) {
        const owner = await this.userRepository.findByPhone(phone);
        if (owner && owner.id !== userId) {
          throw new ConflictException('This phone number is already used by another account.');
        }
      }
      await this.userRepository.updateUserPhone(userId, phone);
    }

    this.logger.log(`Updating profile for artisan user ID: ${userId}`);
    return this.userRepository.updateProfile(userId, dto);
  }
}
