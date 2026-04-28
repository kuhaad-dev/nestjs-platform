import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { MetricsService } from './metrics/metrics.service';
import { MetricsInterceptor } from './metrics/metrics.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks()

const metricsService = app.get(MetricsService);
app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser());
  app.use(helmet());

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN'),
    credentials: true,
  });


  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED');
  if (swaggerEnabled || configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Test Project API')
      .setDescription('Versioned auth and users API')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'Bearer',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(configService.get<number>('PORT') ?? 3000);
  console.log('server connected');


}
bootstrap();