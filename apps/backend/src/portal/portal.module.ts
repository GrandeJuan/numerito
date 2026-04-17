import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { PortalController } from './infrastructure/controllers/portal.controller';
import { ObtenerPortalStatsHandler } from './application/queries/obtener-portal-stats.query';
import { IamModule } from '../iam/iam.module';
import { ObligacionesModule } from '../obligaciones/obligaciones.module';
import { VENCIMIENTOS_PENDIENTES_CLIENTE_VIEW } from '../obligaciones/application/public-views';
import type { VencimientosPendientesClienteView } from '../obligaciones/application/views/vencimientos-pendientes-cliente.view';
import { FacturacionModule } from '../facturacion/facturacion.module';
import { FACTURAS_PENDIENTES_CLIENTE_VIEW } from '../facturacion/application/public-views';
import type { FacturasPendientesClienteView } from '../facturacion/application/views/facturas-pendientes-cliente.view';
import { DocumentosModule } from '../documentos/documentos.module';
import { DOCUMENTOS_CLIENTE_COUNT_VIEW } from '../documentos/application/public-views';
import type { DocumentosClienteCountView } from '../documentos/application/views/documentos-cliente-count.view';

@Module({
  imports: [IamModule, JwtModule.register({}), ObligacionesModule, FacturacionModule, DocumentosModule],
  controllers: [PortalController],
  providers: [
    {
      provide: ObtenerPortalStatsHandler,
      useFactory: (
        em: EntityManager,
        vencimientosPendientesCliente: VencimientosPendientesClienteView,
        facturasPendientesCliente: FacturasPendientesClienteView,
        documentosClienteCount: DocumentosClienteCountView,
      ) => new ObtenerPortalStatsHandler(em, vencimientosPendientesCliente, facturasPendientesCliente, documentosClienteCount),
      inject: [EntityManager, VENCIMIENTOS_PENDIENTES_CLIENTE_VIEW, FACTURAS_PENDIENTES_CLIENTE_VIEW, DOCUMENTOS_CLIENTE_COUNT_VIEW],
    },
  ],
})
export class PortalModule {}
