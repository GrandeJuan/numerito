/**
 * Development seed script.
 * Run: npx ts-node -r tsconfig-paths/register src/shared/infrastructure/seeds/dev-seed.ts
 * Or:  pnpm run seed:dev (from apps/backend)
 *
 * Creates:
 * 1. All lookup/reference data (initial-seed SQL)
 * 2. SUPERADMIN role + user
 * 3. Rol-permiso junction records (default permissions per role)
 * 4. Demo estudio with plan PROFESIONAL
 * 5. SOCIO user linked to the estudio
 * 6. RESPONSABLE + EMPLEADO users linked to the estudio
 * 7. Sample clients, vencimientos, tareas
 */

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { MikroORM, EntityManager } from '@mikro-orm/postgresql';
import config from '../../../mikro-orm.config';
import { SEED_SQL } from './initial-seed';
import { PERMISOS_DEFAULT_SEED } from '../../../iam/infrastructure/seeds/permisos-default.seed';
import { randomUUID as uuid } from 'crypto';

const SALT_ROUNDS = 10;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function run() {
  console.log('🌱 Starting dev seed...\n');

  const orm = await MikroORM.init(config);
  const em = orm.em.fork();

  // ── 0. Run pending schema changes ─────────────────────
  console.log('0/7  Applying schema changes...');
  await em.getConnection().execute(`ALTER TABLE usuario ADD COLUMN IF NOT EXISTS theme_preference varchar(10) NOT NULL DEFAULT 'light';`);
  await em.getConnection().execute(`CREATE TABLE IF NOT EXISTS notificacion (id uuid PRIMARY KEY, usuario_id uuid NOT NULL, estudio_id uuid, tipo varchar(50) NOT NULL, mensaje text NOT NULL, leida boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT NOW(), updated_at timestamptz NOT NULL DEFAULT NOW());`);

  // ── 1. Lookup/reference data ──────────────────────────
  console.log('1/7  Seeding lookup tables...');
  await em.getConnection().execute(SEED_SQL);

  // ── 2. Add SUPERADMIN role ────────────────────────────
  console.log('2/7  Seeding SUPERADMIN role...');
  await em.getConnection().execute(`
    INSERT INTO rol (codigo, nombre) VALUES ('SUPERADMIN', 'Super Administrador')
    ON CONFLICT (codigo) DO NOTHING;
  `);

  // ── 3. Rol-permiso junction (default permissions) ─────
  console.log('3/7  Seeding rol-permiso mappings...');
  for (const [rol, permisos] of Object.entries(PERMISOS_DEFAULT_SEED)) {
    for (const permiso of permisos) {
      await em.getConnection().execute(`
        INSERT INTO rol_permiso (rol_id, permiso_id)
        SELECT r.id, p.id FROM rol r, permiso p
        WHERE r.codigo = '${rol}' AND p.codigo = '${permiso}'
        ON CONFLICT DO NOTHING;
      `);
    }
  }

  // ── 4. Users ──────────────────────────────────────────
  console.log('4/7  Seeding users...');
  const password = await hashPassword('Admin123!');

  const superadminId = uuid();
  const socioId = uuid();
  const responsableId = uuid();
  const empleadoId = uuid();
  const clienteId = uuid();

  const users = [
    { id: superadminId, email: 'superadmin@numerito.com', nombre: 'Super', apellido: 'Admin', rol: 'SUPERADMIN' },
    { id: socioId, email: 'admin@demo.com', nombre: 'Admin', apellido: 'Demo', rol: 'SOCIO' },
    { id: responsableId, email: 'responsable@demo.com', nombre: 'María', apellido: 'González', rol: 'RESPONSABLE' },
    { id: empleadoId, email: 'empleado@demo.com', nombre: 'Juan', apellido: 'Pérez', rol: 'EMPLEADO' },
    { id: clienteId, email: 'cliente@demo.com', nombre: 'Carlos', apellido: 'López', rol: 'CLIENTE' },
  ];

  for (const u of users) {
    await em.getConnection().execute(`
      INSERT INTO usuario (id, email, password_hash, nombre, apellido, rol_id, is_active, email_verified, theme_preference, created_at, updated_at)
      SELECT '${u.id}', '${u.email}', '${password}', '${u.nombre}', '${u.apellido}', r.id, true, true, 'light', NOW(), NOW()
      FROM rol r WHERE r.codigo = '${u.rol}'
      ON CONFLICT (email) DO NOTHING;
    `);
  }

  // ── 5. Demo estudio ───────────────────────────────────
  console.log('5/7  Seeding demo estudio...');
  const estudioId = uuid();
  await em.getConnection().execute(`
    INSERT INTO estudio (id, nombre, plan_id, cuit, is_active, created_at, updated_at)
    SELECT '${estudioId}', 'Estudio Demo', p.id, '20-12345678-9', true, NOW(), NOW()
    FROM plan p WHERE p.codigo = 'PROFESIONAL'
    ON CONFLICT (cuit) DO NOTHING;
  `);

  // Get the actual estudio id (in case it already existed)
  const [estudioRow] = await em.getConnection().execute(`SELECT id FROM estudio WHERE cuit = '20-12345678-9'`);
  const actualEstudioId = estudioRow?.id || estudioId;

  // ── 6. Link users to estudio ──────────────────────────
  console.log('6/7  Linking users to estudio...');
  const links = [
    { userId: socioId, email: 'admin@demo.com', rol: 'SOCIO' },
    { userId: responsableId, email: 'responsable@demo.com', rol: 'RESPONSABLE' },
    { userId: empleadoId, email: 'empleado@demo.com', rol: 'EMPLEADO' },
  ];

  for (const link of links) {
    const [userRow] = await em.getConnection().execute(`SELECT id FROM usuario WHERE email = '${link.email}'`);
    if (userRow) {
      await em.getConnection().execute(`
        INSERT INTO usuario_estudio (id, usuario_id, estudio_id, rol_id, is_active, created_at, updated_at)
        SELECT '${uuid()}', '${userRow.id}', '${actualEstudioId}', r.id, true, NOW(), NOW()
        FROM rol r WHERE r.codigo = '${link.rol}'
        ON CONFLICT ON CONSTRAINT usuario_estudio_usuario_id_estudio_id_unique DO NOTHING;
      `);
    }
  }

  // ── 7. Sample data ────────────────────────────────────
  console.log('7/7  Seeding sample clients and data...');

  // Sample clients
  const clientNames = [
    { razon: 'Panadería El Trigal SRL', cuit: '30-71234567-0', tipo: 'PERSONA_JURIDICA', condicion: 'RESPONSABLE_INSCRIPTO', regimen: 'GENERAL' },
    { razon: 'García María Inés', cuit: '27-28456789-3', tipo: 'PERSONA_FISICA', condicion: 'MONOTRIBUTO', regimen: 'MONOTRIBUTO' },
    { razon: 'Tech Solutions SA', cuit: '30-71567890-5', tipo: 'PERSONA_JURIDICA', condicion: 'RESPONSABLE_INSCRIPTO', regimen: 'GENERAL' },
    { razon: 'Martínez Roberto', cuit: '20-25678901-7', tipo: 'PERSONA_FISICA', condicion: 'MONOTRIBUTO', regimen: 'MONOTRIBUTO' },
    { razon: 'Constructora Del Sur SRL', cuit: '30-71890123-2', tipo: 'PERSONA_JURIDICA', condicion: 'RESPONSABLE_INSCRIPTO', regimen: 'GENERAL' },
  ];

  for (const c of clientNames) {
    await em.getConnection().execute(`
      INSERT INTO cliente (id, estudio_id, razon_social, cuit, tipo_cliente_id, condicion_iva_id, regimen_id, is_active, created_at, updated_at)
      SELECT '${uuid()}', '${actualEstudioId}', '${c.razon}', '${c.cuit}',
        tc.id, ci.id, reg.id, true, NOW(), NOW()
      FROM tipo_cliente tc, condicion_iva ci, regimen reg
      WHERE tc.codigo = '${c.tipo}' AND ci.codigo = '${c.condicion}' AND reg.codigo = '${c.regimen}'
      ON CONFLICT DO NOTHING;
    `);
  }

  // Sample vencimientos
  const today = new Date();
  const vencimientos = [
    { dias: -5, obligacion: 'IVA', estado: 'VENCIDO' },
    { dias: 3, obligacion: 'MONOTRIBUTO', estado: 'PENDIENTE' },
    { dias: 10, obligacion: 'IIBB_ARBA', estado: 'PENDIENTE' },
    { dias: -2, obligacion: 'F931', estado: 'PRESENTADO' },
    { dias: 15, obligacion: 'GANANCIAS', estado: 'PENDIENTE' },
    { dias: -10, obligacion: 'SUSS', estado: 'PRESENTADO' },
  ];

  const [firstClient] = await em.getConnection().execute(
    `SELECT id FROM cliente WHERE estudio_id = '${actualEstudioId}' LIMIT 1`,
  );

  if (firstClient) {
    for (const v of vencimientos) {
      const fecha = new Date(today);
      fecha.setDate(fecha.getDate() + v.dias);
      const periodo = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      await em.getConnection().execute(`
        INSERT INTO vencimiento (id, cliente_id, estudio_id, tipo_obligacion_id, estado_id, fecha_vencimiento, periodo, descripcion, created_at, updated_at)
        SELECT '${uuid()}', '${firstClient.id}', '${actualEstudioId}', t.id, e.id, '${fecha.toISOString().split('T')[0]}', '${periodo}', '${v.obligacion} ${periodo}', NOW(), NOW()
        FROM tipo_obligacion t, estado_vencimiento e
        WHERE t.codigo = '${v.obligacion}' AND e.codigo = '${v.estado}'
        ON CONFLICT DO NOTHING;
      `);
    }
  }

  // Sample tareas
  const [socioUser] = await em.getConnection().execute(`SELECT id FROM usuario WHERE email = 'admin@demo.com'`);
  if (socioUser) {
    const tareas = [
      { titulo: 'Liquidar IVA Panadería El Trigal', estado: 'PENDIENTE', prioridad: 'ALTA' },
      { titulo: 'Presentar DDJJ Ganancias Tech Solutions', estado: 'EN_PROGRESO', prioridad: 'URGENTE' },
      { titulo: 'Rubricar libro Diario', estado: 'PENDIENTE', prioridad: 'MEDIA' },
      { titulo: 'Revisar retenciones marzo', estado: 'COMPLETADO', prioridad: 'BAJA' },
      { titulo: 'Alta monotributo García María', estado: 'EN_PROGRESO', prioridad: 'MEDIA' },
    ];

    for (const t of tareas) {
      await em.getConnection().execute(`
        INSERT INTO tarea (id, estudio_id, titulo, responsable_id, estado_id, prioridad_id, horas_registradas, comentarios, created_at, updated_at)
        SELECT '${uuid()}', '${actualEstudioId}', '${t.titulo}', '${socioUser.id}', et.id, p.id, 0, '[]', NOW(), NOW()
        FROM estado_tarea et, prioridad p
        WHERE et.codigo = '${t.estado}' AND p.codigo = '${t.prioridad}'
        ON CONFLICT DO NOTHING;
      `);
    }
  }

  await orm.close();

  console.log('\n✅ Dev seed complete!');
  console.log('\n📋 Users created:');
  console.log('  superadmin@numerito.com / Admin123!  (SUPERADMIN)');
  console.log('  admin@demo.com / Admin123!           (SOCIO → Estudio Demo)');
  console.log('  responsable@demo.com / Admin123!     (RESPONSABLE → Estudio Demo)');
  console.log('  empleado@demo.com / Admin123!        (EMPLEADO → Estudio Demo)');
  console.log('  cliente@demo.com / Admin123!         (CLIENTE)');
  console.log('\n🏢 Estudio: "Estudio Demo" (CUIT 20-12345678-9, Plan Profesional)');
  console.log('  5 clientes, 6 vencimientos, 5 tareas');
}

run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
