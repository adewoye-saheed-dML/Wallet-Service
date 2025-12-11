import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/jwt.strategy';

// Import Entities
import { User } from './database/user.entity';
import { Wallet } from './database/wallet.entity';
import { ApiKey } from './database/api-key.entity';
import { Transaction } from './database/transaction.entity';

// Import Controllers
import { AuthController } from './auth/auth.controller';
import { WalletController } from './wallet/wallet.controller';
import { KeysController } from './keys/keys.controller';

// Import Services
import { AuthService } from './auth/auth.service';
import { WalletService } from './wallet/wallet.service';
import { KeysService } from './keys/keys.service';
import { PaystackService } from './paystack/paystack.service';

// Import Strategies & Guards
import { GoogleStrategy } from './auth/google.strategy';
import { CompositeAuthGuard } from './common/guards/composite-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    

    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret',
      signOptions: { expiresIn: '1h' },
    }),

    // Database Configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
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


    TypeOrmModule.forFeature([User, Wallet, ApiKey, Transaction]), 
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
    JwtStrategy,
    CompositeAuthGuard
  ],
})
export class AppModule {}