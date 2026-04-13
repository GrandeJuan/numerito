import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './mikro-orm.config';
import { AppController } from './app.controller';
import { CrossContextModule } from './shared/infrastructure/cross-context.module';
import { RequestContextModule } from './shared/infrastructure/request-context.module';
import { IamModule } from './iam/iam.module';
import { EstudioModule } from './estudio/estudio.module';
import { ClientesModule } from './clientes/clientes.module';
import { ObligacionesModule } from './obligaciones/obligaciones.module';
import { ContabilidadModule } from './contabilidad/contabilidad.module';
import { NominaModule } from './nomina/nomina.module';
import { DocumentosModule } from './documentos/documentos.module';
import { TareasModule } from './tareas/tareas.module';
import { FacturacionModule } from './facturacion/facturacion.module';
import { IntegracionesModule } from './integraciones/integraciones.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { AdministracionModule } from './administracion/administracion.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PortalModule } from './portal/portal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    RequestContextModule,
    CrossContextModule,
    IamModule,
    EstudioModule,
    ClientesModule,
    ObligacionesModule,
    ContabilidadModule,
    NominaModule,
    DocumentosModule,
    TareasModule,
    FacturacionModule,
    IntegracionesModule,
    NotificacionesModule,
    AdministracionModule,
    DashboardModule,
    PortalModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
