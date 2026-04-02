import 'dotenv/config';
import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';

// Shared — Geographic
import { PaisSchema } from './shared/infrastructure/persistence/pais.schema';
import { ProvinciaSchema } from './shared/infrastructure/persistence/provincia.schema';
import { LocalidadSchema } from './shared/infrastructure/persistence/localidad.schema';

// Shared — Lookup/Reference
import { CondicionIvaSchema } from './shared/infrastructure/persistence/condicion-iva.schema';
import { RolSchema } from './shared/infrastructure/persistence/rol.schema';
import { TipoClienteSchema } from './shared/infrastructure/persistence/tipo-cliente.schema';
import { RegimenSchema } from './shared/infrastructure/persistence/regimen.schema';
import { TipoObligacionSchema } from './shared/infrastructure/persistence/tipo-obligacion.schema';
import { TipoDocumentoSchema } from './shared/infrastructure/persistence/tipo-documento.schema';
import { TipoLibroSchema } from './shared/infrastructure/persistence/tipo-libro.schema';
import { EstadoVencimientoSchema } from './shared/infrastructure/persistence/estado-vencimiento.schema';
import { EstadoFacturaSchema } from './shared/infrastructure/persistence/estado-factura.schema';
import { EstadoTareaSchema } from './shared/infrastructure/persistence/estado-tarea.schema';
import { PrioridadSchema } from './shared/infrastructure/persistence/prioridad.schema';
import { PlanSchema } from './shared/infrastructure/persistence/plan.schema';
import { OrganismoFiscalSchema } from './shared/infrastructure/persistence/organismo-fiscal.schema';
import { PermisoSchema } from './shared/infrastructure/persistence/permiso.schema';

// Shared — Junction/M2M
import { RolPermisoSchema } from './shared/infrastructure/persistence/rol-permiso.schema';
import { ClienteProvinciaSchema } from './shared/infrastructure/persistence/cliente-provincia.schema';

// IAM
import { UsuarioSchema } from './iam/infrastructure/persistence/usuario.schema';
import { SesionSchema } from './iam/infrastructure/persistence/sesion.schema';
import { UsuarioEstudioSchema } from './iam/infrastructure/persistence/usuario-estudio.schema';

// Estudio
import { EstudioSchema } from './estudio/infrastructure/persistence/estudio.schema';

// Clientes
import { ClienteSchema } from './clientes/infrastructure/persistence/cliente.schema';

// Obligaciones
import { VencimientoSchema } from './obligaciones/infrastructure/persistence/vencimiento.schema';
import { ReglaVencimientoSchema } from './obligaciones/infrastructure/persistence/regla-vencimiento.schema';
import { AlertaConfigSchema } from './obligaciones/infrastructure/persistence/alerta-config.schema';

// Contabilidad
import { LibroContableSchema } from './contabilidad/infrastructure/persistence/libro-contable.schema';
import { AsientoContableSchema } from './contabilidad/infrastructure/persistence/asiento-contable.schema';

// Nomina
import { EmpleadoSchema } from './nomina/infrastructure/persistence/empleado.schema';

// Documentos
import { DocumentoSchema } from './documentos/infrastructure/persistence/documento.schema';

// Tareas
import { TareaSchema } from './tareas/infrastructure/persistence/tarea.schema';

// Facturacion
import { FacturaSchema } from './facturacion/infrastructure/persistence/factura.schema';
import { LineaFacturaSchema } from './facturacion/infrastructure/persistence/linea-factura.schema';
import { PagoSchema } from './facturacion/infrastructure/persistence/pago.schema';
import { MedioPagoSchema } from './shared/infrastructure/persistence/medio-pago.schema';

// Integraciones
import { NotificacionFiscalSchema } from './integraciones/infrastructure/persistence/notificacion-fiscal.schema';
import { CredencialFiscalSchema } from './integraciones/infrastructure/persistence/credencial-fiscal.schema';

export default defineConfig({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  dbName: process.env.DB_NAME || 'numerito',
  entities: [
    // Geographic
    PaisSchema,
    ProvinciaSchema,
    LocalidadSchema,
    // Lookup/Reference
    CondicionIvaSchema,
    RolSchema,
    TipoClienteSchema,
    RegimenSchema,
    TipoObligacionSchema,
    TipoDocumentoSchema,
    TipoLibroSchema,
    EstadoVencimientoSchema,
    EstadoFacturaSchema,
    EstadoTareaSchema,
    PrioridadSchema,
    PlanSchema,
    OrganismoFiscalSchema,
    PermisoSchema,
    // Junction/M2M
    RolPermisoSchema,
    ClienteProvinciaSchema,
    // IAM
    UsuarioSchema,
    SesionSchema,
    UsuarioEstudioSchema,
    // Estudio
    EstudioSchema,
    // Clientes
    ClienteSchema,
    // Obligaciones
    VencimientoSchema,
    ReglaVencimientoSchema,
    AlertaConfigSchema,
    // Contabilidad
    LibroContableSchema,
    AsientoContableSchema,
    // Nomina
    EmpleadoSchema,
    // Documentos
    DocumentoSchema,
    // Tareas
    TareaSchema,
    // Facturacion
    FacturaSchema,
    LineaFacturaSchema,
    PagoSchema,
    MedioPagoSchema,
    // Integraciones
    NotificacionFiscalSchema,
    CredencialFiscalSchema,
  ],
  extensions: [Migrator],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
  debug: process.env.NODE_ENV !== 'production',
});
