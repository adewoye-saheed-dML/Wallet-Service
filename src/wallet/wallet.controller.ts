import { Controller, Post, Body, Get, Req, UseGuards, Headers, BadRequestException, SetMetadata } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CompositeAuthGuard } from '../common/guards/composite-auth.guard';
import { ApiBearerAuth, ApiSecurity, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Param } from '@nestjs/common';

// We keep the helper decorator here
export const RequirePermission = (perm: string) => SetMetadata('permission', perm);

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // --- 1. DEPOSIT (Protected) ---
  @Post('deposit')
  @UseGuards(CompositeAuthGuard)
  @RequirePermission('deposit')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ 
    summary: 'Initialize Paystack Deposit',
    description: 'Generates a payment link from Paystack. The user must visit this link to complete the payment.' 
  })
  @ApiBody({ schema: { example: { amount: 5000 } } })
  async deposit(@Req() req, @Body() body: { amount: number }) {
    if (body.amount <= 0) throw new BadRequestException('Amount must be positive');
    
    if (!Number.isInteger(body.amount)) {
        throw new BadRequestException('Amount must be an integer (no decimals)');
      }

    return this.walletService.initiateDeposit(req.user, body.amount);
  }

  // --- 2. BALANCE (Protected) ---
  @Get('balance')
  @UseGuards(CompositeAuthGuard)
  @RequirePermission('read')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ 
    summary: 'Get Wallet Balance',
    description: 'Retrieves the current available balance and wallet number for the authenticated user.' 
  })
  async getBalance(@Req() req) {
    return this.walletService.getBalance(req.user);
  }

  // --- 3. WEBHOOK (Public) ---
  // Notice: NO @UseGuards here. This allows Paystack to call it.
  @Post('paystack/webhook')
  @ApiOperation({ 
    summary: 'Paystack Webhook (Mandatory)',
    description: 'Receives payment events from Paystack. Verifies the signature and credits the wallet if the payment was successful.' 
  })
  @ApiBody({ schema: { example: { event: 'charge.success', data: { reference: 'REF-123', amount: 500000 } } } })
  async webhook(@Headers('x-paystack-signature') signature: string, @Body() body: any) {
    // The service handles signature validation security
    return this.walletService.processWebhook(signature, body);
  }

  // --- 4. TRANSFER (Protected) ---
  @Post('transfer')
  @UseGuards(CompositeAuthGuard)
  @RequirePermission('transfer')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ 
    summary: 'Transfer funds to another user',
    description: 'Moves funds from the authenticated user\'s wallet to the recipient\'s wallet using an ACID-compliant transaction.' 
  })
  @ApiBody({ schema: { example: { wallet_number: '1234567890', amount: 3000 } } })
  async transfer(@Req() req, @Body() body: { wallet_number: string; amount: number }) {
    if (body.amount <= 0) throw new BadRequestException('Amount must be positive');

    // Integer Check
    if (!Number.isInteger(body.amount)) {
      throw new BadRequestException('Amount must be an integer (no decimals)');
    }
    
    return this.walletService.transferFunds(req.user, body.wallet_number, body.amount);
  }

  // --- 5. HISTORY (Protected) ---
  @Get('transactions')
  @UseGuards(CompositeAuthGuard)
  @RequirePermission('read')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ 
    summary: 'View transaction history',
    description: 'Returns a list of all deposits and transfers (credits and debits) associated with this wallet.' 
  })
  async getHistory(@Req() req) {
    return this.walletService.getHistory(req.user);
  }

  // Verify Deposit Status Endpoint
  @Get('deposit/:reference/status')
  @UseGuards(CompositeAuthGuard) 
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ 
    summary: 'Verify Deposit Status', 
    description: 'Checks the status of a deposit transaction by its reference.' 
  })
  async verifyStatus(@Param('reference') reference: string) {
    return this.walletService.verifyDepositStatus(reference);
  }
}