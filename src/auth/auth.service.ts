import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/user.entity';
import { Wallet } from '../database/wallet.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    private jwtService: JwtService,
  ) {}

  async googleLogin(req) {
    if (!req.user) return 'No user from google';

    // 1. Check if user exists
    let user = await this.userRepo.findOne({ where: { email: req.user.email } });

    // 2. If not, CREATE User AND Wallet (Requirement: Wallet creation per user)
    if (!user) {
      // Create Wallet first
      const newWallet = this.walletRepo.create({
        wallet_number: randomBytes(5).toString('hex'), // Simple unique string for now
        balance: 0,
      });
      await this.walletRepo.save(newWallet);

      // Create User linked to Wallet
      user = this.userRepo.create({
        email: req.user.email,
        googleId: req.user.googleId,
        wallet: newWallet,
      });
      await this.userRepo.save(user);
    }

    // 3. Return JWT Token
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}