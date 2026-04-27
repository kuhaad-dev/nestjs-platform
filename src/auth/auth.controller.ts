import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth/refresh',
};

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: UserResponseDto })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(200)
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Req() req: Request & { user: { id: number; email: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(req.user);

    res.cookie('refreshToken', result.refreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('Bearer')
  @ApiOkResponse({ type: UserResponseDto })
  me(@Req() req: Request & { user: { id: number } }) {
    return this.authService.me(req.user.id);
  }

@UseGuards(JwtRefreshGuard)
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@HttpCode(200)
@Post('refresh')
@ApiBearerAuth('Bearer')
@ApiOkResponse({ type: AuthResponseDto })
@ApiCookieAuth('refreshToken')
@ApiOperation({
  summary: 'Rotate access and refresh tokens',
  description:
    'Uses the refreshToken HTTP-only cookie to validate and rotate tokens.',
})
  async refresh(
    @Req() req: Request & { user: { id: number; email: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    const result = await this.authService.refresh(req.user.id, refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('logout')
  @ApiBearerAuth('Bearer')
  @ApiOkResponse({ schema: { example: { success: true } } })
  async logout(
    @Req() req: Request & { user: { id: number } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.id);
    res.clearCookie('refreshToken', {
      ...refreshCookieOptions,
      maxAge: undefined,
    });
    return { success: true };
  }
}