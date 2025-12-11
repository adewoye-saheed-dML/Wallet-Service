import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PaystackService {
  private readonly secretKey = process.env.PAYSTACK_SECRET_KEY; 

  async initializeTransaction(email: string, amount: number, reference: string) {
    // Paystack expects amount in Kobo (multiply by 100)
    const params = {
      email,
      amount: amount * 100, 
      reference,
      callback_url: process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/api',
    };

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        params,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data; 
    } catch (error) {
      throw new BadRequestException('Paystack initialization failed');
    }
  }

  // Utility to verify webhook signature 
  verifySignature(signature: string, body: any): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(JSON.stringify(body))
      .digest('hex');
    
    return hash === signature;
  }
}