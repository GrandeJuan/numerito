import { Module } from '@nestjs/common';
import { TAREA_REPOSITORY } from './domain/repositories/tarea.repository';
import type { TareaRepository } from './domain/repositories/tarea.repository';
import { MikroOrmTareaRepository } from './infrastructure/persistence/mikro-orm-tarea.repository';
import { TareasController } from './infrastructure/controllers/tareas.controller';
import { IniciarTareaHandler } from './application/commands/iniciar-tarea.command';
import { CompletarTareaHandler } from './application/commands/completar-tarea.command';
import type { EventBus } from '../shared/domain/event-bus';
import { EVENT_BUS } from '../shared/domain/event-bus';

@Module({
  controllers: [TareasController],
  providers: [
    { provide: TAREA_REPOSITORY, useClass: MikroOrmTareaRepository },
    {
      provide: IniciarTareaHandler,
      useFactory: (repo: TareaRepository, eventBus: EventBus) =>
        new IniciarTareaHandler(repo, eventBus),
      inject: [TAREA_REPOSITORY, EVENT_BUS],
    },
    {
      provide: CompletarTareaHandler,
      useFactory: (repo: TareaRepository, eventBus: EventBus) =>
        new CompletarTareaHandler(repo, eventBus),
      inject: [TAREA_REPOSITORY, EVENT_BUS],
    },
  ],
  exports: [TAREA_REPOSITORY],
})
export class TareasModule {}
