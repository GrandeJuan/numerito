import { Module } from '@nestjs/common';
import { ClientesController } from './infrastructure/controllers/clientes.controller';
import { CrearClienteHandler } from './application/commands/crear-cliente.command';
import { CLIENTE_REPOSITORY } from './domain/repositories/cliente.repository';
import type { ClienteRepository } from './domain/repositories/cliente.repository';
import { MikroOrmClienteRepository } from './infrastructure/persistence/mikro-orm-cliente.repository';

@Module({
  imports: [],
  controllers: [ClientesController],
  providers: [
    { provide: CLIENTE_REPOSITORY, useClass: MikroOrmClienteRepository },
    {
      provide: CrearClienteHandler,
      useFactory: (repo: ClienteRepository) => new CrearClienteHandler(repo),
      inject: [CLIENTE_REPOSITORY],
    },
  ],
  exports: [CLIENTE_REPOSITORY],
})
export class ClientesModule {}
