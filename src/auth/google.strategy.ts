import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',         
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '', 
      // Use the dynamic callback URL or fallback for safety
      callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, id, displayName } = profile;
    
    // Construct the user object to pass to the AuthService
    const user = {
      email: emails[0].value,
      googleId: id,
      // Try to get full name, fallback to given+family name
      full_name: displayName || `${name.givenName} ${name.familyName}`,
    };
    done(null, user);
  }
}