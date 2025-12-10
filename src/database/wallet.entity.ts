import { Entity, PrimaryGeneratedColumn, Column, OneToOne, 
    JoinColumn,
    CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  wallet_number: string; 

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ default: 'NGN' })
  currency: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn()
  user: User;
}