import { Module } from '@nestjs/common';
import { TAREA_REPOSITORY } from './domain/repositories/tarea.repository';
import { MikroOrmTareaRepository } from './infrastructure/persistence/mikro-orm-tarea.repository';
import { TareasController } from './infrastructure/controllers/tareas.controller';

@Module({
  controllers: [TareasController],
  providers: [
    { provide: TAREA_REPOSITORY, useClass: MikroOrmTareaRepository },
  ],
  exports: [TAREA_REPOSITORY],
})
export class TareasModule {}
