import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable CORS (Crucial for public access)
  app.enableCors();

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

  // 2. UPDATE: Use Dynamic Port and bind to 0.0.0.0
  // Koyeb/Render provides the PORT in process.env.PORT
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();