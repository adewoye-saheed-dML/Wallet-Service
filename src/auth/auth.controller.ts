import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ 
    summary: 'Triggers Google Sign-In',
    description: 'Redirects the user to the Google OAuth2 login page to initiate authentication.' // <--- Added
  })
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ 
    summary: 'Logs in user and returns JWT',
    description: 'Handles the callback from Google, creates the user/wallet if they do not exist, and returns a JWT access token + user details.' // <--- Added
  })
  googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req);
  }
}