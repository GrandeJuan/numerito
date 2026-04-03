import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get('MICROSOFT_CLIENT_ID', ''),
      clientSecret: configService.get('MICROSOFT_CLIENT_SECRET', ''),
      callbackURL: `${configService.get('OAUTH_CALLBACK_URL', 'http://localhost:3001')}/v1/auth/microsoft/callback`,
      scope: ['user.read'],
      tenant: 'common',
      authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: Array<{ value: string }>;
      name?: { givenName?: string; familyName?: string };
      displayName?: string;
    },
    done: (err: Error | null, user?: unknown) => void,
  ): void {
    done(null, {
      provider: 'microsoft' as const,
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      nombre: profile.name?.givenName ?? profile.displayName ?? '',
      apellido: profile.name?.familyName ?? '',
    });
  }
}
