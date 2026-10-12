import * as functions from 'firebase-functions';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from '../api/dist/app.module';

// Cache the server instance across invocations (cold start optimization)
let cachedServer: express.Express;

async function bootstrapServer(): Promise<express.Express> {
  if (cachedServer) return cachedServer;

  const expressApp = express();

  // CORS — allow Firebase Hosting domains + localhost
  const allowedOriginPatterns = [
    /\.web\.app$/,
    /\.firebaseapp\.com$/,
    /^http:\/\/localhost(:\d+)?$/,
  ];

  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn', 'log'],
  });

  nestApp.setGlobalPrefix('api');

  nestApp.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Check against allowed patterns
      for (const pattern of allowedOriginPatterns) {
        if (pattern.test(origin)) return callback(null, true);
      }
      // In non-production, allow all origins
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  });

  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger docs (only useful if you hit /api/docs directly)
  const config = new DocumentBuilder()
    .setTitle('CAR API')
    .setDescription('CAR automotive platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(nestApp, config);
  SwaggerModule.setup('api/docs', nestApp, document);

  await nestApp.init();

  cachedServer = expressApp;
  return cachedServer;
}

// Lazy initialization — first request triggers NestJS bootstrap
export const api = functions.https.onRequest(async (req, res) => {
  try {
    const server = await bootstrapServer();
    server(req, res);
  } catch (error) {
    functions.logger.error('API handler error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
