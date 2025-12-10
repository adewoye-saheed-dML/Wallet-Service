import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// 1. Import Entities
import { User } from './database/user.entity';
import { Wallet } from './database/wallet.entity';
import { ApiKey } from './database/api-key.entity';
import { Transaction } from './database/transaction.entity';

// 2. Import Controllers
import { AuthController } from './auth/auth.controller';
import { WalletController } from './wallet/wallet.controller';
import { KeysController } from './keys/keys.controller';

// 3. Import Services
import { AuthService } from './auth/auth.service';
import { WalletService } from './wallet/wallet.service';
import { KeysService } from './keys/keys.service';
import { PaystackService } from './paystack/paystack.service';

// 4. Import Strategies & Guards
import { GoogleStrategy } from './auth/google.strategy';
import { CompositeAuthGuard } from './common/guards/composite-auth.guard';

@Module({
  imports: [
    // Load .env file
    ConfigModule.forRoot({ isGlobal: true }), 
    
    // Auth Requirements
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret',
      signOptions: { expiresIn: '1h' },
    }),

    // Database Configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      // FIX 1: Add || '' to strings to handle undefined
      host: process.env.DB_HOST || 'localhost',
      // FIX 2: Handle parseInt safely
      port: parseInt(process.env.DB_PORT || '5432'), 
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wallet_db',
      entities: [User, Wallet, ApiKey, Transaction], 
      synchronize: true, 
      
      // SSL Logic
      ssl: process.env.DB_HOST !== 'localhost',
      extra: {
        ssl: process.env.DB_HOST !== 'localhost' 
          ? { rejectUnauthorized: false } 
          : null,
      },
    }),
  ],
  controllers: [
    AuthController, 
    WalletController, 
    KeysController
  ],
  providers: [
    AuthService, 
    WalletService, 
    KeysService, 
    PaystackService,
    GoogleStrategy,
    CompositeAuthGuard
  ],
})
export class AppModule {}