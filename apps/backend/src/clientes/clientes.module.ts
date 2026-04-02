import { Module } from '@nestjs/common';
import { CLIENTE_REPOSITORY } from './domain/repositories/cliente.repository';
import { MikroOrmClienteRepository } from './infrastructure/persistence/mikro-orm-cliente.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [
    { provide: CLIENTE_REPOSITORY, useClass: MikroOrmClienteRepository },
  ],
  exports: [CLIENTE_REPOSITORY],
})
export class ClientesModule {}
