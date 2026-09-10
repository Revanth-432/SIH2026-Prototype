import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseJwtPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const jwtSecret =
      configService.get<string>('SUPABASE_JWT_SECRET') ||
      process.env.SUPABASE_JWT_SECRET ||
      'fallback-dev-secret';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: SupabaseJwtPayload): Promise<AuthenticatedUser> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid or malformed Supabase JWT token.');
    }

    const roles = payload.app_metadata?.roles || ['ARTISAN'];

    return {
      id: payload.sub,
      email: payload.email,
      phone: payload.phone,
      roles,
      metadata: payload.user_metadata,
    };
  }
}
