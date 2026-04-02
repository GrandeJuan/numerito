import { Module } from '@nestjs/common';
import { TAREA_REPOSITORY } from './domain/repositories/tarea.repository';
import { MikroOrmTareaRepository } from './infrastructure/persistence/mikro-orm-tarea.repository';

@Module({
  providers: [
    { provide: TAREA_REPOSITORY, useClass: MikroOrmTareaRepository },
  ],
  exports: [TAREA_REPOSITORY],
})
export class TareasModule {}
