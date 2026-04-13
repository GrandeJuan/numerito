import { Module } from '@nestjs/common';
import { ClientesController } from './infrastructure/controllers/clientes.controller';
import { CrearClienteHandler } from './application/commands/crear-cliente.command';
import { CLIENTE_REPOSITORY } from './domain/repositories/cliente.repository';
import type { ClienteRepository } from './domain/repositories/cliente.repository';
import { MikroOrmClienteRepository } from './infrastructure/persistence/mikro-orm-cliente.repository';
import type { TenantContext } from '../shared/domain/tenant-context';
import { REQUEST_CONTEXT } from '../shared/infrastructure/services/request-context.service';

@Module({
  imports: [],
  controllers: [ClientesController],
  providers: [
    { provide: CLIENTE_REPOSITORY, useClass: MikroOrmClienteRepository },
    {
      provide: CrearClienteHandler,
      useFactory: (repo: ClienteRepository, context: TenantContext) =>
        new CrearClienteHandler(repo, context),
      inject: [CLIENTE_REPOSITORY, REQUEST_CONTEXT],
    },
  ],
  exports: [CLIENTE_REPOSITORY],
})
export class ClientesModule {}
