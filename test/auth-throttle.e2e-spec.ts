import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';

describe('Auth throttling (e2e)', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  let email = '';
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.enableCors({
      origin: true,
      credentials: true,
    });
    app.use(helmet());
    await app.init();

    agent = request.agent(app.getHttpServer());

    email = `throttle_${Date.now()}@example.com`;

    await agent
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns 429 after repeated bad logins', async () => {
    for (let i = 0; i < 5; i++) {
      await agent
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPassword123!' });
    }

    await agent
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPassword123!' })
      .expect(429);
  });
});