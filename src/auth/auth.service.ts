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

    // Check if user exists 
    let user = await this.userRepo.findOne({ 
      where: { email: req.user.email },
      relations: ['wallet'] 
    });

    
    if (!user) {
      const newWallet = this.walletRepo.create({
        wallet_number: randomBytes(5).toString('hex'),
        balance: 0,
      });
      await this.walletRepo.save(newWallet);


      user = this.userRepo.create({
        email: req.user.email,
        full_name: req.user.full_name, 
        googleId: req.user.googleId,
        wallet: newWallet,
      });
      await this.userRepo.save(user);
      user.wallet = newWallet;
    }

  //  Generate Token
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        wallet: {
          id: user.wallet.id,
          wallet_number: user.wallet.wallet_number,
          balance: user.wallet.balance,
          created_at: user.wallet.created_at,
        },
      },
      accessToken: accessToken,
      tokenType: 'bearer',
    };
  }
}