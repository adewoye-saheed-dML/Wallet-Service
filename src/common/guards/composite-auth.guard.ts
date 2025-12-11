import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport'; 
  import { KeysService } from '../../keys/keys.service';
  import { Reflector } from '@nestjs/core';
  
  @Injectable()
  export class CompositeAuthGuard extends AuthGuard('jwt') implements CanActivate {
    constructor(
      private readonly keysService: KeysService,
      private readonly reflector: Reflector,
    ) {
      super();
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const apiKey = request.headers['x-api-key'];
  
      // --- STRATEGY 1: API KEY ---
      if (apiKey) {
        const keyEntity = await this.keysService.validateKey(apiKey);
        if (!keyEntity) throw new UnauthorizedException('Invalid or Expired API Key');
  
        // Check Permissions (if route requires specific ones)
        const requiredPermission = this.reflector.get<string>('permission', context.getHandler());
        if (requiredPermission && !keyEntity.permissions.includes(requiredPermission)) {
          throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
        }
  
        // Attach user to request so the controller thinks a user is logged in
        request.user = keyEntity.user; 
        request.isApiKey = true; 
        return true;
      }
  
      // --- STRATEGY 2: JWT (Bearer) ---
      // If no API key, fall back to standard JWT check
      try {
        return (await super.canActivate(context)) as boolean;
      } catch (err) {
        throw new UnauthorizedException('No valid Bearer Token or API Key provided');
      }
    }
  }