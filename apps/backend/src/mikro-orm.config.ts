import 'dotenv/config';
import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';

// IAM
import { UsuarioSchema } from './iam/infrastructure/persistence/usuario.schema';
import { SesionSchema } from './iam/infrastructure/persistence/sesion.schema';
import { UsuarioEstudioSchema } from './iam/infrastructure/persistence/usuario-estudio.schema';

// Tenant
import { EstudioSchema } from './tenant/infrastructure/persistence/estudio.schema';

// Clientes
import { ClienteSchema } from './clientes/infrastructure/persistence/cliente.schema';

// Obligaciones
import { VencimientoSchema } from './obligaciones/infrastructure/persistence/vencimiento.schema';

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

// Integraciones
import { NotificacionFiscalSchema } from './integraciones/infrastructure/persistence/notificacion-fiscal.schema';

export default defineConfig({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  dbName: process.env.DB_NAME || 'numerito',
  entities: [
    UsuarioSchema,
    SesionSchema,
    UsuarioEstudioSchema,
    EstudioSchema,
    ClienteSchema,
    VencimientoSchema,
    LibroContableSchema,
    AsientoContableSchema,
    EmpleadoSchema,
    DocumentoSchema,
    TareaSchema,
    FacturaSchema,
    NotificacionFiscalSchema,
  ],
  extensions: [Migrator],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
  debug: process.env.NODE_ENV !== 'production',
});
