import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../database/wallet.entity';
import { Transaction, TransactionStatus, TransactionType } from '../database/transaction.entity';
import { PaystackService } from '../paystack/paystack.service';
import { randomBytes } from 'crypto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    private paystackService: PaystackService,
    private dataSource: DataSource,
  ) {}

  //  INITIATE DEPOSIT
  async initiateDeposit(user: any, amount: number) {
    const wallet = await this.walletRepo.findOne({ where: { user: { id: user.id } } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const reference = `REF-${randomBytes(8).toString('hex')}`;

    const transaction = this.transactionRepo.create({
      amount,
      reference,
      status: TransactionStatus.PENDING,
      type: TransactionType.DEPOSIT,
      receiver_wallet: wallet,
    });
    await this.transactionRepo.save(transaction);

    const paystackResponse = await this.paystackService.initializeTransaction(
      user.email,
      amount,
      reference,
    );

    return {
      reference,
      authorization_url: paystackResponse.authorization_url,
    };
  }

  //  PROCESS WEBHOOK
  async processWebhook(signature: string, eventData: any) {
    if (!this.paystackService.verifySignature(signature, eventData)) {
      throw new BadRequestException('Invalid Signature');
    }

    const { event, data } = eventData;
    if (event !== 'charge.success') return { status: 'ignored' };

    const reference = data.reference;
    const amountPaid = data.amount / 100;

    const transaction = await this.transactionRepo.findOne({
      where: { reference },
      relations: ['receiver_wallet'],
    });

    if (!transaction) return { status: 'failed', message: 'Transaction not found' };

    if (transaction.status === TransactionStatus.SUCCESS) {
      return { status: 'success', message: 'Already processed' };
    }

    transaction.status = TransactionStatus.SUCCESS;
    await this.transactionRepo.save(transaction);

    const wallet = transaction.receiver_wallet;
    // Safety check here
    if (wallet) {
        wallet.balance = Number(wallet.balance) + Number(amountPaid);
        await this.walletRepo.save(wallet);
    }

    return { status: 'success' };
  }

  //  GET BALANCE
  async getBalance(user: any) {
    const wallet = await this.walletRepo.findOne({ where: { user: { id: user.id } } });
   
    if (!wallet) throw new NotFoundException('Wallet not found');
    
    return { balance: wallet.balance,
            wallet_number: wallet.wallet_number
    };
  }

  // ---  WALLET TRANSFER ---
  async transferFunds(senderUser: any, receiverWalletNumber: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const senderWallet = await queryRunner.manager.findOne(Wallet, {
        where: { user: { id: senderUser.id } },
      });

      if (!senderWallet) {
          throw new NotFoundException('Sender wallet not found');
      }

      if (Number(senderWallet.balance) < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      const receiverWallet = await queryRunner.manager.findOne(Wallet, {
        where: { wallet_number: receiverWalletNumber },
      });

      if (!receiverWallet) {
        throw new NotFoundException('Recipient wallet not found');
      }

      if (senderWallet.id === receiverWallet.id) {
        throw new BadRequestException('Cannot transfer to self');
      }

      senderWallet.balance = Number(senderWallet.balance) - amount;
      receiverWallet.balance = Number(receiverWallet.balance) + amount;

      await queryRunner.manager.save(senderWallet);
      await queryRunner.manager.save(receiverWallet);

      const transaction = this.transactionRepo.create({
        reference: `TRF-${randomBytes(8).toString('hex')}`,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.SUCCESS,
        amount: amount,
        sender_wallet: senderWallet,
        receiver_wallet: receiverWallet,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return { status: 'success', message: 'Transfer completed', reference: transaction.reference };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ---  TRANSACTION HISTORY ---
  async getHistory(user: any) {
    const wallet = await this.walletRepo.findOne({ where: { user: { id: user.id } } });

    if (!wallet) throw new NotFoundException('Wallet not found');

    const transactions = await this.transactionRepo.find({
      where: [
        { sender_wallet: { id: wallet.id } },
        { receiver_wallet: { id: wallet.id } }
      ],
      order: { created_at: 'DESC' },
      relations: ['sender_wallet', 'receiver_wallet'],
    });

    return transactions.map((tx) => ({
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      reference: tx.reference,
      date: tx.created_at,
      direction: tx.sender_wallet?.id === wallet.id ? 'debit' : 'credit',
    }));
  }

// Verify Deposit Status
async verifyDepositStatus(reference: string) {
  const transaction = await this.transactionRepo.findOne({
    where: { reference },
  });

  if (!transaction) throw new NotFoundException('Transaction not found');

  return {
    reference: transaction.reference,
    status: transaction.status,
    amount: transaction.amount,
  };
};
}