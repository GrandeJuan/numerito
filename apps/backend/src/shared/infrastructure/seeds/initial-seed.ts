/**
 * Initial seed SQL for all lookup/reference tables.
 * Exports raw SQL strings to be executed against the database.
 */

export const SEED_SQL = `
-- ============================================
-- PAIS
-- ============================================
INSERT INTO pais (codigo, nombre) VALUES ('AR', 'Argentina')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- PROVINCIA (24 provincias + CABA)
-- ============================================
INSERT INTO provincia (pais_id, nombre) VALUES
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Buenos Aires'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Ciudad Autónoma de Buenos Aires'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Catamarca'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Chaco'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Chubut'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Córdoba'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Corrientes'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Entre Ríos'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Formosa'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Jujuy'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'La Pampa'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'La Rioja'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Mendoza'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Misiones'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Neuquén'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Río Negro'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Salta'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'San Juan'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'San Luis'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Santa Cruz'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Santa Fe'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Santiago del Estero'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Tierra del Fuego'),
  ((SELECT id FROM pais WHERE codigo = 'AR'), 'Tucumán')
ON CONFLICT DO NOTHING;

-- ============================================
-- CONDICION IVA
-- ============================================
INSERT INTO condicion_iva (codigo, nombre, alicuota) VALUES
  ('RESPONSABLE_INSCRIPTO', 'Responsable Inscripto', 21.00),
  ('MONOTRIBUTO', 'Monotributista', 0.00),
  ('EXENTO', 'Exento', 0.00),
  ('NO_RESPONSABLE', 'No Responsable', 0.00),
  ('CONSUMIDOR_FINAL', 'Consumidor Final', 0.00)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- ROL
-- ============================================
INSERT INTO rol (codigo, nombre) VALUES
  ('SOCIO', 'Socio'),
  ('RESPONSABLE', 'Responsable'),
  ('EMPLEADO', 'Empleado'),
  ('CLIENTE', 'Cliente')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- TIPO CLIENTE
-- ============================================
INSERT INTO tipo_cliente (codigo, nombre) VALUES
  ('PERSONA_FISICA', 'Persona Física'),
  ('PERSONA_JURIDICA', 'Persona Jurídica'),
  ('SOCIEDAD', 'Sociedad')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- REGIMEN
-- ============================================
INSERT INTO regimen (codigo, nombre) VALUES
  ('GENERAL', 'Régimen General'),
  ('MONOTRIBUTO', 'Monotributo')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- TIPO OBLIGACION (28 tipos)
-- ============================================
INSERT INTO tipo_obligacion (codigo, nombre, periodicidad) VALUES
  ('IVA', 'IVA', 'MENSUAL'),
  ('GANANCIAS', 'Ganancias', 'ANUAL'),
  ('BIENES_PERSONALES', 'Bienes Personales', 'ANUAL'),
  ('MONOTRIBUTO', 'Monotributo', 'MENSUAL'),
  ('IIBB_ARBA', 'Ingresos Brutos ARBA', 'MENSUAL'),
  ('IIBB_AGIP', 'Ingresos Brutos AGIP', 'MENSUAL'),
  ('IIBB_CONVENIO_MULTILATERAL', 'IIBB Convenio Multilateral', 'MENSUAL'),
  ('SUSS', 'SUSS', 'MENSUAL'),
  ('SICOSS', 'SICOSS', 'MENSUAL'),
  ('F931', 'Formulario 931', 'MENSUAL'),
  ('DDJJ_IVA', 'DDJJ IVA', 'MENSUAL'),
  ('DDJJ_GANANCIAS', 'DDJJ Ganancias', 'ANUAL'),
  ('DDJJ_BIENES_PERSONALES', 'DDJJ Bienes Personales', 'ANUAL'),
  ('SICORE', 'SICORE', 'QUINCENAL'),
  ('SIRE', 'SIRE', 'MENSUAL'),
  ('LIBRO_IVA_DIGITAL', 'Libro IVA Digital', 'MENSUAL'),
  ('CITI_COMPRAS', 'CITI Compras', 'MENSUAL'),
  ('CITI_VENTAS', 'CITI Ventas', 'MENSUAL'),
  ('PERCEPCION_IVA', 'Percepción IVA', 'MENSUAL'),
  ('RETENCION_IVA', 'Retención IVA', 'MENSUAL'),
  ('PERCEPCION_IIBB', 'Percepción IIBB', 'MENSUAL'),
  ('RETENCION_IIBB', 'Retención IIBB', 'MENSUAL'),
  ('PERCEPCION_GANANCIAS', 'Percepción Ganancias', 'MENSUAL'),
  ('RETENCION_GANANCIAS', 'Retención Ganancias', 'MENSUAL'),
  ('PRESENTACION_BALANCES', 'Presentación de Balances', 'ANUAL'),
  ('RUBRICA_LIBROS', 'Rúbrica de Libros', 'ANUAL'),
  ('CERTIFICACION_INGRESOS', 'Certificación de Ingresos', 'ANUAL'),
  ('OTRO', 'Otro', 'MENSUAL')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- TIPO DOCUMENTO
-- ============================================
INSERT INTO tipo_documento (codigo, nombre) VALUES
  ('BALANCE', 'Balance'),
  ('DDJJ', 'Declaración Jurada'),
  ('FACTURA', 'Factura'),
  ('RECIBO_SUELDO', 'Recibo de Sueldo'),
  ('CONTRATO', 'Contrato'),
  ('PODER', 'Poder'),
  ('ESTATUTO', 'Estatuto'),
  ('CERTIFICACION', 'Certificación'),
  ('OTRO', 'Otro')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- TIPO LIBRO
-- ============================================
INSERT INTO tipo_libro (codigo, nombre) VALUES
  ('IVA_COMPRAS', 'IVA Compras'),
  ('IVA_VENTAS', 'IVA Ventas'),
  ('SUELDOS', 'Sueldos'),
  ('DIARIO', 'Diario'),
  ('INVENTARIO_BALANCES', 'Inventario y Balances')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- CATALOGO OBLIGACION
-- ============================================
INSERT INTO catalogo_obligacion (id, nombre, tipo_obligacion, jurisdiccion, frecuencia, activo, created_at, updated_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'IVA Mensual (ARCA)', 'IVA', 'ARCA', 'MENSUAL', true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000002', 'SICOSS Mensual (ARCA)', 'SICOSS', 'ARCA', 'MENSUAL', true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000003', 'Monotributo Mensual (ARCA)', 'MONOTRIBUTO', 'ARCA', 'MENSUAL', true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000004', 'IIBB ARBA Mensual', 'IIBB_ARBA', 'ARBA', 'MENSUAL', true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000005', 'IIBB AGIP Mensual', 'IIBB_AGIP', 'AGIP', 'MENSUAL', true, NOW(), NOW())
ON CONFLICT (tipo_obligacion, jurisdiccion) DO NOTHING;

-- ============================================
-- ESTADO VENCIMIENTO
-- ============================================
INSERT INTO estado_vencimiento (codigo, nombre) VALUES
  ('PENDIENTE', 'Pendiente'),
  ('PRESENTADO', 'Presentado'),
  ('VENCIDO', 'Vencido')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- MEDIO PAGO
-- ============================================
INSERT INTO medio_pago (codigo, nombre) VALUES
  ('TRANSFERENCIA', 'Transferencia Bancaria'),
  ('CHEQUE', 'Cheque'),
  ('EFECTIVO', 'Efectivo'),
  ('TARJETA_CREDITO', 'Tarjeta de Crédito'),
  ('TARJETA_DEBITO', 'Tarjeta de Débito')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- ESTADO FACTURA
-- ============================================
INSERT INTO estado_factura (codigo, nombre) VALUES
  ('EMITIDA', 'Emitida'),
  ('PARCIALMENTE_PAGADA', 'Parcialmente Pagada'),
  ('PAGADA', 'Pagada'),
  ('VENCIDA', 'Vencida'),
  ('ANULADA', 'Anulada')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- ESTADO TAREA
-- ============================================
INSERT INTO estado_tarea (codigo, nombre) VALUES
  ('PENDIENTE', 'Pendiente'),
  ('EN_PROGRESO', 'En Progreso'),
  ('COMPLETADO', 'Completado')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- PRIORIDAD
-- ============================================
INSERT INTO prioridad (codigo, nombre, orden) VALUES
  ('BAJA', 'Baja', 1),
  ('MEDIA', 'Media', 2),
  ('ALTA', 'Alta', 3),
  ('URGENTE', 'Urgente', 4)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- ESTADO SUBSCRIPCION
-- ============================================
INSERT INTO estado_subscripcion (codigo, nombre) VALUES
  ('TRIAL', 'Trial'),
  ('ACTIVA', 'Activa'),
  ('SUSPENDIDA', 'Suspendida'),
  ('CANCELADA', 'Cancelada'),
  ('VENCIDA', 'Vencida')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- CICLO FACTURACION
-- ============================================
INSERT INTO ciclo_facturacion (codigo, nombre) VALUES
  ('MENSUAL', 'Mensual'),
  ('ANUAL', 'Anual')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- PLAN
-- ============================================
INSERT INTO plan (codigo, nombre, max_clientes, max_usuarios, precio) VALUES
  ('FREE', 'Free', 5, 1, 0.00),
  ('PROFESIONAL', 'Profesional', 50, 5, 9999.00),
  ('ENTERPRISE', 'Enterprise', 999999, 999999, 49999.00)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- PERMISO (21 permisos from Permiso enum)
-- ============================================
INSERT INTO permiso (codigo, nombre, modulo) VALUES
  ('GESTIONAR_USUARIOS', 'Gestionar Usuarios', 'IAM'),
  ('VER_USUARIOS', 'Ver Usuarios', 'IAM'),
  ('GESTIONAR_CLIENTES', 'Gestionar Clientes', 'CLIENTES'),
  ('VER_CLIENTES', 'Ver Clientes', 'CLIENTES'),
  ('GESTIONAR_OBLIGACIONES', 'Gestionar Obligaciones', 'OBLIGACIONES'),
  ('VER_OBLIGACIONES', 'Ver Obligaciones', 'OBLIGACIONES'),
  ('GESTIONAR_CONTABILIDAD', 'Gestionar Contabilidad', 'CONTABILIDAD'),
  ('VER_CONTABILIDAD', 'Ver Contabilidad', 'CONTABILIDAD'),
  ('GESTIONAR_NOMINA', 'Gestionar Nómina', 'NOMINA'),
  ('VER_NOMINA', 'Ver Nómina', 'NOMINA'),
  ('GESTIONAR_DOCUMENTOS', 'Gestionar Documentos', 'DOCUMENTOS'),
  ('VER_DOCUMENTOS', 'Ver Documentos', 'DOCUMENTOS'),
  ('GESTIONAR_TAREAS', 'Gestionar Tareas', 'TAREAS'),
  ('VER_TAREAS', 'Ver Tareas', 'TAREAS'),
  ('GESTIONAR_FACTURACION', 'Gestionar Facturación', 'FACTURACION'),
  ('VER_FACTURACION', 'Ver Facturación', 'FACTURACION'),
  ('GESTIONAR_CONFIGURACION', 'Gestionar Configuración', 'CONFIGURACION'),
  ('VER_PROPIOS_DATOS', 'Ver Propios Datos', 'PORTAL_CLIENTE'),
  ('VER_PROPIOS_DOCUMENTOS', 'Ver Propios Documentos', 'PORTAL_CLIENTE'),
  ('VER_PROPIOS_VENCIMIENTOS', 'Ver Propios Vencimientos', 'PORTAL_CLIENTE')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- REGLA VENCIMIENTO — IVA ARCA (10 terminaciones CUIT)
-- Fechas según calendario ARCA año fiscal 2026.
-- mesSiguiente = true → el vencimiento cae el mes posterior al periodo.
-- Regimen GENERAL = Responsable Inscripto.
-- ============================================
INSERT INTO regla_vencimiento (tipo_obligacion_id, terminacion_cuit, dia_vencimiento, mes_siguiente, jurisdiccion, regimen, vigencia_desde, vigencia_hasta, origen, estado) VALUES
  ((SELECT id FROM tipo_obligacion WHERE codigo = 'IVA'), '0', 18, true, 'ARCA', 'GENERAL', '2026-01-01', NULL, 'MANUAL', 'ACTIVA'),
  ((SELECT id FROM tipo_obligacion WHERE codigo = 'IVA'), '1', 18, true, 'ARCA', 'GENERAL', '2026-01-01', NULL, 'MANUAL', 'ACTIVA'),
  ((SELECT id FROM tipo_obligacion WHERE codigo = 'IVA'), '2', 19, true, 'ARCA', 'GENERAL', '2026-01-01', NULL, 'MANUAL', 'ACTIVA'),
  ((SELECT id FROM tipo_obligacion WHERE codigo = 'IVA'), '3', 19, true, 'ARCA', 'GENERAL', '2026-01-01', NULL, 'MANUAL', 'ACTIVA'),
  ((SELECT id FROM tipo_obligacion WHERE codigo = 'IVA'), '4', 20, true, 'ARCA', 'GENERAL', '2026-01-01', NULL, 'MANUAL', 'ACTIVA'),
  ((SELECT id FROM tipo_obligacion WHERE codigo = 'IVA'), '5', 20, true, 'ARCA', 'GENERAL', '2026-01-01', NULL, 'MANUAL', 'ACTIVA'),
  ((SELECT id FROM tipo_obligacion WHERE codigo = 'IVA'), '6', 21, true, 'ARCA', 'GENERAL', '2026-01-01', NULL, 'MANUAL', 'ACTIVA'),
  ((SELECT id FROM tipo_obligacion WHERE codigo = 'IVA'), '7', 21, true, 'ARCA', 'GENERAL', '2026-01-01', NULL, 'MANUAL', 'ACTIVA'),
  ((SELECT id FROM tipo_obligacion WHERE codigo = 'IVA'), '8', 22, true, 'ARCA', 'GENERAL', '2026-01-01', NULL, 'MANUAL', 'ACTIVA'),
  ((SELECT id FROM tipo_obligacion WHERE codigo = 'IVA'), '9', 22, true, 'ARCA', 'GENERAL', '2026-01-01', NULL, 'MANUAL', 'ACTIVA')
ON CONFLICT DO NOTHING;

-- ============================================
-- CONFIGURACION INGESTA (4 fuentes deshabilitadas)
-- ============================================
INSERT INTO configuracion_ingesta (id, fuente, habilitado, cadencia_dias, proxima_ejecucion, ultima_ejecucion, ultimo_resultado, created_at, updated_at) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'ARCA', false, 7, NULL, NULL, NULL, NOW(), NOW()),
  ('d0000000-0000-0000-0000-000000000002', 'ARBA', false, 7, NULL, NULL, NULL, NOW(), NOW()),
  ('d0000000-0000-0000-0000-000000000003', 'AGIP', false, 7, NULL, NULL, NULL, NOW(), NOW()),
  ('d0000000-0000-0000-0000-000000000004', 'BCRA_FERIADOS', false, 30, NULL, NULL, NULL, NOW(), NOW())
ON CONFLICT (fuente) DO NOTHING;
`;
