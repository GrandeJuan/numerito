import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PortalController } from './infrastructure/controllers/portal.controller';
import { ObtenerPortalStatsHandler } from './application/queries/obtener-portal-stats.query';
import { IamModule } from '../iam/iam.module';
import { ObligacionesModule } from '../obligaciones/obligaciones.module';
import { VENCIMIENTOS_PENDIENTES_CLIENTE_VIEW } from '../obligaciones/application/public-views';
import type { VencimientosPendientesClienteView } from '../obligaciones/application/views/vencimientos-pendientes-cliente.view';
import { VENCIMIENTOS_RECIENTES_CLIENTE_VIEW } from '../obligaciones/application/public-views';
import type { VencimientosRecientesClienteView } from '../obligaciones/application/views/vencimientos-recientes-cliente.view';
import { FacturacionModule } from '../facturacion/facturacion.module';
import { FACTURAS_PENDIENTES_CLIENTE_VIEW } from '../facturacion/application/public-views';
import type { FacturasPendientesClienteView } from '../facturacion/application/views/facturas-pendientes-cliente.view';
import { FACTURAS_RECIENTES_CLIENTE_VIEW } from '../facturacion/application/public-views';
import type { FacturasRecientesClienteView } from '../facturacion/application/views/facturas-recientes-cliente.view';
import { DocumentosModule } from '../documentos/documentos.module';
import { DOCUMENTOS_CLIENTE_COUNT_VIEW } from '../documentos/application/public-views';
import type { DocumentosClienteCountView } from '../documentos/application/views/documentos-cliente-count.view';
import { DOCUMENTOS_RECIENTES_CLIENTE_VIEW } from '../documentos/application/public-views';
import type { DocumentosRecientesClienteView } from '../documentos/application/views/documentos-recientes-cliente.view';
import { ClientesModule } from '../clientes/clientes.module';
import { CLIENTE_POR_USUARIO_PORTAL_VIEW } from '../clientes/application/public-views';
import type { ClientePorUsuarioPortalView } from '../clientes/application/views/cliente-por-usuario-portal.view';

@Module({
  imports: [IamModule, JwtModule.register({}), ObligacionesModule, FacturacionModule, DocumentosModule, ClientesModule],
  controllers: [PortalController],
  providers: [
    {
      provide: ObtenerPortalStatsHandler,
      useFactory: (
        vencimientosPendientesCliente: VencimientosPendientesClienteView,
        facturasPendientesCliente: FacturasPendientesClienteView,
        documentosClienteCount: DocumentosClienteCountView,
        vencimientosRecientesCliente: VencimientosRecientesClienteView,
        facturasRecientesCliente: FacturasRecientesClienteView,
        documentosRecientesCliente: DocumentosRecientesClienteView,
        clientePorUsuario: ClientePorUsuarioPortalView,
      ) => new ObtenerPortalStatsHandler(
        vencimientosPendientesCliente,
        facturasPendientesCliente,
        documentosClienteCount,
        vencimientosRecientesCliente,
        facturasRecientesCliente,
        documentosRecientesCliente,
        clientePorUsuario,
      ),
      inject: [
        VENCIMIENTOS_PENDIENTES_CLIENTE_VIEW,
        FACTURAS_PENDIENTES_CLIENTE_VIEW,
        DOCUMENTOS_CLIENTE_COUNT_VIEW,
        VENCIMIENTOS_RECIENTES_CLIENTE_VIEW,
        FACTURAS_RECIENTES_CLIENTE_VIEW,
        DOCUMENTOS_RECIENTES_CLIENTE_VIEW,
        CLIENTE_POR_USUARIO_PORTAL_VIEW,
      ],
    },
  ],
})
export class PortalModule {}
