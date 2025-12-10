import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Import your entities
import { User } from './database/user.entity';
import { Wallet } from './database/wallet.entity';
import { ApiKey } from './database/api-key.entity';
import { Transaction } from './database/transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Wallet, ApiKey, Transaction], 
      synchronize: true, 
    }),
  ],
})
export class AppModule {}