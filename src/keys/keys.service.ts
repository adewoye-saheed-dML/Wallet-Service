import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../database/api-key.entity';
import { User } from '../database/user.entity';
import { randomBytes } from 'crypto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class KeysService {
  constructor(
    @InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>,
  ) {}

  async createKey(user: User, name: string, permissions: string[], expiryStr: string) {
    // 1. Check limit (Max 5 keys)
    const count = await this.apiKeyRepo.count({ where: { user: { id: user.id }, is_active: true } });
    if (count >= 5) throw new BadRequestException('Max 5 active keys allowed');

    // 2. Parse Expiry (Simple parser)
    const expiresAt = new Date();
    if (expiryStr === '1H') expiresAt.setHours(expiresAt.getHours() + 1);
    else if (expiryStr === '1D') expiresAt.setDate(expiresAt.getDate() + 1);
    else if (expiryStr === '1M') expiresAt.setMonth(expiresAt.getMonth() + 1);
    else if (expiryStr === '1Y') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else throw new BadRequestException('Invalid expiry format (1H, 1D, 1M, 1Y)');

    // 3. Generate Key (sk_live_...)
    const keyString = `sk_live_${randomBytes(20).toString('hex')}`;

    const newKey = this.apiKeyRepo.create({
      key: keyString,
      name,
      permissions,
      expires_at: expiresAt,
      user,
    });

    return this.apiKeyRepo.save(newKey);
  }

  async validateKey(keyString: string): Promise<ApiKey | null> {
    const key = await this.apiKeyRepo.findOne({
      where: { key: keyString, is_active: true },
      relations: ['user'], // Load user so we know who owns it
    });

    if (!key) return null;
    if (new Date() > key.expires_at) return null; // Key expired

    return key;
  }

  async rolloverKey(user: any, expiredKeyId: string, newExpiryStr: string) {
    // 1. Find the old key
    const oldKey = await this.apiKeyRepo.findOne({
      where: { id: expiredKeyId, user: { id: user.id } },
    });

    if (!oldKey) throw new BadRequestException('Key not found or does not belong to user');

    // 2. Rule: "The expired key must truly be expired."
    if (new Date() < oldKey.expires_at) {
      throw new BadRequestException('Cannot rollover: Key is not yet expired');
    }

    // 3. Deactivate old key (if not already)
    oldKey.is_active = false;
    await this.apiKeyRepo.save(oldKey);

    // 4. Rule: "New key must reuse the same permissions."
    // 5. Rule: "expiry must again be converted to a new expires_at value."
    // We reuse the createKey logic we wrote earlier
    return this.createKey(user, oldKey.name, oldKey.permissions, newExpiryStr);
  }

  // Revoke API Key
  async revokeKey(user: any, keyId: string) {
    const key = await this.apiKeyRepo.findOne({
      where: { id: keyId, user: { id: user.id } },
    });

    if (!key) throw new NotFoundException('API Key not found or does not belong to user');

    key.is_active = false;
    await this.apiKeyRepo.save(key);

    return { message: 'API Key revoked successfully' };
  }
}