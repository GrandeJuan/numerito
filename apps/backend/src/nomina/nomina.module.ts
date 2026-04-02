import { Module } from '@nestjs/common';
import { EMPLEADO_REPOSITORY } from './domain/repositories/empleado.repository';
import { MikroOrmEmpleadoRepository } from './infrastructure/persistence/mikro-orm-empleado.repository';

@Module({
  providers: [
    { provide: EMPLEADO_REPOSITORY, useClass: MikroOrmEmpleadoRepository },
  ],
  exports: [EMPLEADO_REPOSITORY],
})
export class NominaModule {}
