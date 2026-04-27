import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    me: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers via service', async () => {
    mockAuthService.register.mockResolvedValue({ id: 1, email: 'a@b.com' });

    const result = await controller.register({
      email: 'a@b.com',
      password: 'Password123!',
    });

    expect(result.email).toBe('a@b.com');
  });
});