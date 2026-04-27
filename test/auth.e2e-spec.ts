import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';

describe('Auth e2e', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  let email = '';
  const password = 'Password123!';
  let accessToken = '';

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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('registers a user', async () => {
    email = `test_${Date.now()}@example.com`;

    await agent
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);
  });

  it('rejects duplicate registration', async () => {
    await agent
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(409);
  });

  it('logs in and sets refresh cookie', async () => {
    const res = await agent
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    accessToken = res.body.accessToken;
    expect(accessToken).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects wrong password', async () => {
    await agent
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPassword123!' })
      .expect(401);
  });

  it('returns current user with access token', async () => {
    await agent
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe(email);
      });
  });

  it('rejects me without token', async () => {
    await agent.get('/api/v1/auth/me').expect(401);
  });

  it('refreshes tokens using cookie', async () => {
    const res = await agent
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.headers['set-cookie']).toBeDefined();

    accessToken = res.body.accessToken;
  });

  it('logs out and clears refresh cookie', async () => {
    await agent
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });
  });

  it('rejects refresh after logout', async () => {
    await agent
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });
});