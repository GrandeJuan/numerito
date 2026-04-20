import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ClientesController } from './infrastructure/controllers/clientes.controller';
import { CrearClienteHandler } from './application/commands/crear-cliente.command';
import { ActualizarClienteHandler } from './application/commands/actualizar-cliente.command';
import { DesactivarClienteHandler } from './application/commands/desactivar-cliente.command';
import { ActivarClienteHandler } from './application/commands/activar-cliente.command';
import { AsignarResponsableHandler } from './application/commands/asignar-responsable.command';
import { CLIENTE_REPOSITORY } from './domain/repositories/cliente.repository';
import type { ClienteRepository } from './domain/repositories/cliente.repository';
import { MikroOrmClienteRepository } from './infrastructure/persistence/mikro-orm-cliente.repository';
import { CLIENTE_SUMMARY_VIEW, CLIENTE_POR_USUARIO_PORTAL_VIEW, CLIENTE_COUNT_POR_ESTUDIO_VIEW } from './application/public-views';
import { ClienteSummaryView } from './application/views/cliente-summary.view';
import { ClientePorUsuarioPortalView } from './application/views/cliente-por-usuario-portal.view';
import { ClienteCountPorEstudioView } from './application/views/cliente-count-por-estudio.view';

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
    {
      provide: CLIENTE_SUMMARY_VIEW,
      useFactory: (em: EntityManager) => new ClienteSummaryView(em),
      inject: [EntityManager],
    },
    {
      provide: CLIENTE_POR_USUARIO_PORTAL_VIEW,
      useFactory: (em: EntityManager) => new ClientePorUsuarioPortalView(em),
      inject: [EntityManager],
    },
    {
      provide: CLIENTE_COUNT_POR_ESTUDIO_VIEW,
      useFactory: (em: EntityManager) => new ClienteCountPorEstudioView(em),
      inject: [EntityManager],
    },
  ],
  exports: [CLIENTE_REPOSITORY, CLIENTE_SUMMARY_VIEW, CLIENTE_POR_USUARIO_PORTAL_VIEW, CLIENTE_COUNT_POR_ESTUDIO_VIEW],
})
export class ClientesModule {}
