import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EVENT_BUS } from '../domain/event-bus';
import { EventEmitterBus } from './services/event-emitter-bus';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    {
      provide: EVENT_BUS,
      useClass: EventEmitterBus,
    },
  ],
  exports: [EVENT_BUS],
})
export class EventBusModule {}
