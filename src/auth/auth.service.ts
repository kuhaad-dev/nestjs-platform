import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PasswordService } from '../common/security/password.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getAccessTtl(): JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>('JWT_ACCESS_TTL') ?? '15m') as JwtSignOptions['expiresIn'];
  }

  private getRefreshTtl(): JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>('JWT_REFRESH_TTL') ?? '7d') as JwtSignOptions['expiresIn'];
  }

  private getAccessSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  private getRefreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async register(registerDto: RegisterDto) {
    return this.usersService.create(registerDto);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      this.logger.warn(`Auth failure: invalid email attempt for ${email}`);
      return null;
    }

    const valid = await this.passwordService.verify(user.password, password);
    if (!valid) {
      this.logger.warn(`Auth failure: invalid password for ${email}`);
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async signTokens(user: { id: number; email: string }) {
    const payload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessTtl(),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshTtl(),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async login(user: { id: number; email: string }) {
    const tokens = await this.signTokens(user);
    const refreshTokenHash = await argon2.hash(tokens.refreshToken);

    await this.usersService.setRefreshTokenHash(user.id, refreshTokenHash);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    };
  }

  async refresh(userId: number, refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const user = await this.usersService.findByIdWithRefreshToken(userId);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Access denied');
    }

    const valid = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!valid) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.signTokens({ id: user.id, email: user.email });
    const newRefreshTokenHash = await argon2.hash(tokens.refreshToken);

    await this.usersService.setRefreshTokenHash(user.id, newRefreshTokenHash);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  async logout(userId: number) {
    await this.usersService.setRefreshTokenHash(userId, null);
    return { success: true };
  }

  async me(userId: number) {
    return this.usersService.findById(userId);
  }
}