import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from './shared/infrastructure/decorators/public.decorator';

@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
