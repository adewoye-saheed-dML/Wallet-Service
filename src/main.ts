import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('HNG Wallet Service')
    .setDescription('Wallet API with Paystack, JWT, and API Keys')
    .setVersion('1.0')
    // 1. Add JWT (Bearer) Auth
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth', 
    )
    // 2. Add API Key Auth
    .addApiKey(
      { type: 'apiKey', name: 'x-api-key', in: 'header', description: 'API Key for services' },
      'API-Key', 
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();