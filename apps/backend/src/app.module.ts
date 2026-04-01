import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './mikro-orm.config';
import { AppController } from './app.controller';
import { IamModule } from './iam/iam.module';
import { TenantModule } from './tenant/tenant.module';
import { ClientesModule } from './clientes/clientes.module';
import { ObligacionesModule } from './obligaciones/obligaciones.module';
import { ContabilidadModule } from './contabilidad/contabilidad.module';
import { NominaModule } from './nomina/nomina.module';
import { DocumentosModule } from './documentos/documentos.module';
import { TareasModule } from './tareas/tareas.module';
import { FacturacionModule } from './facturacion/facturacion.module';
import { IntegracionesModule } from './integraciones/integraciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    IamModule,
    TenantModule,
    ClientesModule,
    ObligacionesModule,
    ContabilidadModule,
    NominaModule,
    DocumentosModule,
    TareasModule,
    FacturacionModule,
    IntegracionesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
