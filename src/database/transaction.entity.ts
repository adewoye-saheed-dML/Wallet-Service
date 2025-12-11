import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ unique: true })
  reference: string; 

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status: TransactionStatus;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

 
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  fee: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Wallet, { nullable: true }) 
  @JoinColumn({ name: 'sender_wallet_id' })
  sender_wallet: Wallet;

  @ManyToOne(() => Wallet, { nullable: true }) 
  @JoinColumn({ name: 'receiver_wallet_id' })
  receiver_wallet: Wallet;
}