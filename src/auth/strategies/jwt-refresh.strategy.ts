import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.refreshToken ?? null,
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access denied');
    }

    return { id: user.id, email: user.email };
  }
}