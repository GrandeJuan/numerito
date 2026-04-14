import { Module } from '@nestjs/common';
import { ClientesController } from './infrastructure/controllers/clientes.controller';
import { CrearClienteHandler } from './application/commands/crear-cliente.command';
import { ActualizarClienteHandler } from './application/commands/actualizar-cliente.command';
import { DesactivarClienteHandler } from './application/commands/desactivar-cliente.command';
import { ActivarClienteHandler } from './application/commands/activar-cliente.command';
import { AsignarResponsableHandler } from './application/commands/asignar-responsable.command';
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
      useFactory: (repo: ClienteRepository) =>
        new CrearClienteHandler(repo),
      inject: [CLIENTE_REPOSITORY],
    },
    {
      provide: ActualizarClienteHandler,
      useFactory: (repo: ClienteRepository) =>
        new ActualizarClienteHandler(repo),
      inject: [CLIENTE_REPOSITORY],
    },
    {
      provide: DesactivarClienteHandler,
      useFactory: (repo: ClienteRepository) =>
        new DesactivarClienteHandler(repo),
      inject: [CLIENTE_REPOSITORY],
    },
    {
      provide: ActivarClienteHandler,
      useFactory: (repo: ClienteRepository) =>
        new ActivarClienteHandler(repo),
      inject: [CLIENTE_REPOSITORY],
    },
    {
      provide: AsignarResponsableHandler,
      useFactory: (repo: ClienteRepository) =>
        new AsignarResponsableHandler(repo),
      inject: [CLIENTE_REPOSITORY],
    },
  ],
  exports: [CLIENTE_REPOSITORY],
})
export class ClientesModule {}
