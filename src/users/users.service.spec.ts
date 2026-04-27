import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PasswordService } from '../common/security/password.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockPasswordService = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: PasswordService, useValue: mockPasswordService },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a user with hashed password', async () => {
    mockRepository.findOne.mockResolvedValue(null);
    mockPasswordService.hash.mockResolvedValue('hashed-pass');
    mockRepository.create.mockReturnValue({
      id: 1,
      email: 'a@b.com',
      password: 'hashed-pass',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockRepository.save.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      email: 'a@b.com',
      password: 'Password123!',
    });

    expect(result.email).toBe('a@b.com');
    expect(mockPasswordService.hash).toHaveBeenCalledWith('Password123!');
  });

  it('throws if email already exists', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
    });

    await expect(
      service.create({
        email: 'a@b.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('saves refresh token hash', async () => {
    await service.setRefreshTokenHash(1, 'hash-value');
    expect(mockRepository.update).toHaveBeenCalledWith(1, {
      refreshTokenHash: 'hash-value',
    });
  });
});