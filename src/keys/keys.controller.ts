import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { KeysService } from './keys.service';
import { CompositeAuthGuard } from '../common/guards/composite-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { Delete, Param } from '@nestjs/common';

@ApiTags('API Keys')
@Controller('keys')
@UseGuards(CompositeAuthGuard) 
@ApiBearerAuth('JWT-auth') 
export class KeysController {
  constructor(private readonly keysService: KeysService) {}

  // ENDPOINTS
  @Post('create')
  @ApiOperation({ 
    summary: 'Create a new API Key',
    description: 'Generates a secure API key with specific permissions (read, deposit, transfer) and an expiration time.' 
  })
  @ApiBody({ schema: { example: { name: 'service-a', permissions: ['deposit'], expiry: '1D' } } })
  async createKey(@Req() req, @Body() body: { name: string; permissions: string[]; expiry: string }) {
    const validExpiry = ['1H', '1D', '1M', '1Y'];
    if (!validExpiry.includes(body.expiry)) {
      throw new BadRequestException('Expiry must be 1H, 1D, 1M, or 1Y');
    }
    return this.keysService.createKey(req.user, body.name, body.permissions, body.expiry);
  }

  
  @Post('rollover')
  @ApiOperation({ 
    summary: 'Rollover Expired API Key',
    description: 'Invalidates an old/expired key and issues a new one with the exact same permissions.' 
  })
  @ApiBody({ schema: { example: { expired_key_id: 'uuid-here', expiry: '1M' } } })
  async rolloverKey(@Req() req, @Body() body: { expired_key_id: string; expiry: string }) {
    const validExpiry = ['1H', '1D', '1M', '1Y'];
    if (!validExpiry.includes(body.expiry)) {
      throw new BadRequestException('Expiry must be 1H, 1D, 1M, or 1Y');
    }
    return this.keysService.rolloverKey(req.user, body.expired_key_id, body.expiry);
  }

 
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Revoke an API Key', 
    description: 'Deactivates an API key so it can no longer be used.' 
  })
  async revokeKey(@Req() req, @Param('id') id: string) {
    return this.keysService.revokeKey(req.user, id);
  }
}