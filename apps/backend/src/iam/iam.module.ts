import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { TOKEN_SERVICE } from './application/services/token.service';

@Module({
  imports: [JwtModule.register({}), ConfigModule],
  providers: [
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [TOKEN_SERVICE, JwtAuthGuard, RolesGuard],
})
export class IamModule {}
