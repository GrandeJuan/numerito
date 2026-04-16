import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { TAREA_REPOSITORY } from './domain/repositories/tarea.repository';
import type { TareaRepository } from './domain/repositories/tarea.repository';
import { MikroOrmTareaRepository } from './infrastructure/persistence/mikro-orm-tarea.repository';
import { TareasController } from './infrastructure/controllers/tareas.controller';
import { CrearTareaHandler } from './application/commands/crear-tarea.command';
import { IniciarTareaHandler } from './application/commands/iniciar-tarea.command';
import { CompletarTareaHandler } from './application/commands/completar-tarea.command';
import { AsignarTareaHandler } from './application/commands/asignar-tarea.command';
import { RegistrarHorasHandler } from './application/commands/registrar-horas.command';
import { AgregarComentarioHandler } from './application/commands/agregar-comentario.command';
import { TareaListHandler } from './application/queries/tarea-list.query';
import { TareaKpisHandler } from './application/queries/tarea-kpis.query';
import type { EventBus } from '../shared/domain/event-bus';
import { EVENT_BUS } from '../shared/domain/event-bus';

@Module({
  controllers: [TareasController],
  providers: [
    { provide: TAREA_REPOSITORY, useClass: MikroOrmTareaRepository },
    {
      provide: CrearTareaHandler,
      useFactory: (repo: TareaRepository, eventBus: EventBus) =>
        new CrearTareaHandler(repo, eventBus),
      inject: [TAREA_REPOSITORY, EVENT_BUS],
    },
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
    {
      provide: AsignarTareaHandler,
      useFactory: (repo: TareaRepository, eventBus: EventBus) =>
        new AsignarTareaHandler(repo, eventBus),
      inject: [TAREA_REPOSITORY, EVENT_BUS],
    },
    {
      provide: RegistrarHorasHandler,
      useFactory: (repo: TareaRepository, eventBus: EventBus) =>
        new RegistrarHorasHandler(repo, eventBus),
      inject: [TAREA_REPOSITORY, EVENT_BUS],
    },
    {
      provide: AgregarComentarioHandler,
      useFactory: (repo: TareaRepository, eventBus: EventBus) =>
        new AgregarComentarioHandler(repo, eventBus),
      inject: [TAREA_REPOSITORY, EVENT_BUS],
    },
    {
      provide: TareaListHandler,
      useFactory: (em: EntityManager) => new TareaListHandler(em),
      inject: [EntityManager],
    },
    {
      provide: TareaKpisHandler,
      useFactory: (em: EntityManager) => new TareaKpisHandler(em),
      inject: [EntityManager],
    },
  ],
  exports: [TAREA_REPOSITORY],
})
export class TareasModule {}
