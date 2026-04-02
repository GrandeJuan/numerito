import { Module } from '@nestjs/common';
import { ClientesController } from './infrastructure/controllers/clientes.controller';
import { CLIENTE_REPOSITORY } from './domain/repositories/cliente.repository';
import { MikroOrmClienteRepository } from './infrastructure/persistence/mikro-orm-cliente.repository';

@Module({
  imports: [],
  controllers: [ClientesController],
  providers: [
    { provide: CLIENTE_REPOSITORY, useClass: MikroOrmClienteRepository },
  ],
  exports: [CLIENTE_REPOSITORY],
})
export class ClientesModule {}
