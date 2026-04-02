import { Module } from '@nestjs/common';
import { EMPLEADO_REPOSITORY } from './domain/repositories/empleado.repository';
import { MikroOrmEmpleadoRepository } from './infrastructure/persistence/mikro-orm-empleado.repository';
import { NominaController } from './infrastructure/controllers/nomina.controller';

@Module({
  controllers: [NominaController],
  providers: [
    { provide: EMPLEADO_REPOSITORY, useClass: MikroOrmEmpleadoRepository },
  ],
  exports: [EMPLEADO_REPOSITORY],
})
export class NominaModule {}
