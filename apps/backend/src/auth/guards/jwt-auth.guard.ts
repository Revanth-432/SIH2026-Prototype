import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      process.env.SUPABASE_URL ||
      'https://iaitqhnyouqgcmedlony.supabase.co';
    const serviceRoleKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      '';

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token is missing or invalid.');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException(
          error?.message || 'Invalid or expired Supabase authentication token.',
        );
      }

      const roles: string[] =
        (user.app_metadata?.roles as string[]) ||
        [((user.user_metadata?.role as string) || 'ARTISAN')];

      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        roles,
        metadata: user.user_metadata as Record<string, unknown>,
      };

      request.user = authenticatedUser;
      return true;
    } catch (err: any) {
      this.logger.warn(`JWT validation failed: ${err.message}`);
      throw new UnauthorizedException(err.message || 'Authentication failed.');
    }
  }
}
