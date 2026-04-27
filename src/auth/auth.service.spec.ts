import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../common/security/password.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    create: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findById: jest.fn(),
    findByIdWithRefreshToken: jest.fn(),
    setRefreshTokenHash: jest.fn(),
  };

  const mockPasswordService = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('super-secret'),
    get: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user', async () => {
    mockUsersService.create.mockResolvedValue({ id: 1, email: 'a@b.com' });

    const result = await service.register({
      email: 'a@b.com',
      password: 'Password123!',
    });

    expect(result.email).toBe('a@b.com');
    expect(mockUsersService.create).toHaveBeenCalled();
  });

  it('validates a user with password', async () => {
    mockUsersService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      password: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPasswordService.verify.mockResolvedValue(true);

    const result = await service.validateUser('a@b.com', 'Password123!');

    expect(result.email).toBe('a@b.com');
  });

  it('returns tokens on login and stores refresh hash', async () => {
    mockJwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    mockUsersService.setRefreshTokenHash.mockResolvedValue(undefined);

    const result = await service.login({ id: 1, email: 'a@b.com' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(mockUsersService.setRefreshTokenHash).toHaveBeenCalled();
  });
}); 