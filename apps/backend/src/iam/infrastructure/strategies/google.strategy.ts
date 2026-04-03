import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID', ''),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: `${configService.get('OAUTH_CALLBACK_URL', 'http://localhost:3001')}/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: Array<{ value: string }>;
      name?: { givenName?: string; familyName?: string };
    },
    done: VerifyCallback,
  ): void {
    done(null, {
      provider: 'google' as const,
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      nombre: profile.name?.givenName ?? '',
      apellido: profile.name?.familyName ?? '',
    });
  }
}
