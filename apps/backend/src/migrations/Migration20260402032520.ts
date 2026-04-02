import { Migration } from '@mikro-orm/migrations';

export class Migration20260402032520 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "cliente_provincia" ("cliente_id" uuid not null, "provincia_id" int not null, primary key ("cliente_id", "provincia_id"));`);

    this.addSql(`create table "condicion_iva" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null, "alicuota" numeric(5,2) not null);`);
    this.addSql(`alter table "condicion_iva" add constraint "condicion_iva_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "estado_factura" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null);`);
    this.addSql(`alter table "estado_factura" add constraint "estado_factura_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "estado_tarea" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null);`);
    this.addSql(`alter table "estado_tarea" add constraint "estado_tarea_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "estado_vencimiento" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null);`);
    this.addSql(`alter table "estado_vencimiento" add constraint "estado_vencimiento_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "organismo_fiscal" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null, "jurisdiccion" varchar(255) not null, "url_portal" varchar(255) not null, "requiere_scraping" boolean not null, "tiene_web_service" boolean not null, "activo" boolean not null default true);`);
    this.addSql(`alter table "organismo_fiscal" add constraint "organismo_fiscal_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "pais" ("id" serial primary key, "codigo" char(2) not null, "nombre" varchar(255) not null);`);
    this.addSql(`alter table "pais" add constraint "pais_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "permiso" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null, "modulo" varchar(255) not null);`);
    this.addSql(`alter table "permiso" add constraint "permiso_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "plan" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null, "max_clientes" int not null, "max_usuarios" int not null, "precio" numeric(10,2) not null);`);
    this.addSql(`alter table "plan" add constraint "plan_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "estudio" ("id" uuid not null, "nombre" varchar(255) not null, "plan_id" int not null, "cuit" varchar(13) not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "estudio" add constraint "estudio_cuit_unique" unique ("cuit");`);

    this.addSql(`create table "alerta_config" ("id" uuid not null, "tenant_id" uuid not null, "dias_anticipacion" int not null, "canal_notificacion" varchar(255) not null, "activa" boolean not null default true, primary key ("id"));`);
    this.addSql(`alter table "alerta_config" add constraint "alerta_config_tenant_id_unique" unique ("tenant_id");`);

    this.addSql(`create table "prioridad" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null, "orden" int not null);`);
    this.addSql(`alter table "prioridad" add constraint "prioridad_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "provincia" ("id" serial primary key, "pais_id" int not null, "nombre" varchar(255) not null);`);

    this.addSql(`create table "localidad" ("id" serial primary key, "provincia_id" int not null, "nombre" varchar(255) not null);`);

    this.addSql(`create table "regimen" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null);`);
    this.addSql(`alter table "regimen" add constraint "regimen_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "rol" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null);`);
    this.addSql(`alter table "rol" add constraint "rol_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "rol_permiso" ("rol_id" int not null, "permiso_id" int not null, primary key ("rol_id", "permiso_id"));`);

    this.addSql(`create table "tipo_cliente" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null);`);
    this.addSql(`alter table "tipo_cliente" add constraint "tipo_cliente_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "tipo_documento" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null);`);
    this.addSql(`alter table "tipo_documento" add constraint "tipo_documento_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "tipo_libro" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null);`);
    this.addSql(`alter table "tipo_libro" add constraint "tipo_libro_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "tipo_obligacion" ("id" serial primary key, "codigo" varchar(255) not null, "nombre" varchar(255) not null, "periodicidad" varchar(255) not null);`);
    this.addSql(`alter table "tipo_obligacion" add constraint "tipo_obligacion_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "regla_vencimiento" ("id" serial primary key, "tipo_obligacion_id" int not null, "terminacion_cuit" char(1) not null, "dia_vencimiento" int not null, "mes_siguiente" boolean not null);`);

    this.addSql(`create table "usuario" ("id" uuid not null, "email" varchar(255) not null, "password_hash" varchar(255) not null, "nombre" varchar(255) not null, "apellido" varchar(255) not null, "rol_id" int not null, "is_active" boolean not null default true, "email_verified" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "usuario" add constraint "usuario_email_unique" unique ("email");`);

    this.addSql(`create table "sesion" ("id" uuid not null, "usuario_id" uuid not null, "refresh_token" varchar(255) not null, "ip_address" varchar(255) not null, "user_agent" varchar(255) not null, "expires_at" timestamptz not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "sesion_usuario_id_index" on "sesion" ("usuario_id");`);

    this.addSql(`create table "cliente" ("id" uuid not null, "cuit" varchar(13) not null, "razon_social" varchar(255) not null, "condicion_iva_id" int not null, "tipo_cliente_id" int not null, "regimen_id" int not null, "tenant_id" uuid not null, "responsable_id" uuid null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "cliente_tenant_id_index" on "cliente" ("tenant_id");`);
    this.addSql(`create index "cliente_cuit_tenant_id_index" on "cliente" ("cuit", "tenant_id");`);
    this.addSql(`create index "cliente_responsable_id_index" on "cliente" ("responsable_id");`);

    this.addSql(`create table "tarea" ("id" uuid not null, "titulo" varchar(255) not null, "descripcion" varchar(255) null, "cliente_id" uuid null, "tenant_id" uuid not null, "estado_id" int not null, "prioridad_id" int not null, "responsable_id" uuid null, "horas_registradas" numeric(8,2) not null default 0, "comentarios" jsonb not null default '[]', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "tarea_tenant_id_index" on "tarea" ("tenant_id");`);
    this.addSql(`create index "tarea_cliente_id_index" on "tarea" ("cliente_id");`);
    this.addSql(`create index "tarea_responsable_id_index" on "tarea" ("responsable_id");`);
    this.addSql(`create index "tarea_tenant_id_estado_id_index" on "tarea" ("tenant_id", "estado_id");`);

    this.addSql(`create table "notificacion_fiscal" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "organismo_id" int not null, "cuit_cliente" varchar(13) not null, "asunto" varchar(255) not null, "contenido" text not null, "fecha_notificacion" timestamptz not null, "estado" varchar(20) not null default 'PENDIENTE', "nota_gestion" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "notificacion_fiscal_tenant_id_index" on "notificacion_fiscal" ("tenant_id");`);
    this.addSql(`create index "notificacion_fiscal_cliente_id_index" on "notificacion_fiscal" ("cliente_id");`);
    this.addSql(`create index "notificacion_fiscal_tenant_id_estado_index" on "notificacion_fiscal" ("tenant_id", "estado");`);
    this.addSql(`create index "notificacion_fiscal_fecha_notificacion_index" on "notificacion_fiscal" ("fecha_notificacion");`);

    this.addSql(`create table "libro_contable" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "tipo_libro_id" int not null, "periodo" varchar(7) not null, "is_rubricado" boolean not null default false, "numero_rubrica" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "libro_contable_tenant_id_index" on "libro_contable" ("tenant_id");`);
    this.addSql(`create index "libro_contable_cliente_id_index" on "libro_contable" ("cliente_id");`);
    this.addSql(`create index "libro_contable_cliente_id_tipo_libro_id_periodo_index" on "libro_contable" ("cliente_id", "tipo_libro_id", "periodo");`);

    this.addSql(`create table "factura" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "numero" varchar(30) not null, "fecha_emision" timestamptz not null, "fecha_vencimiento" timestamptz not null, "subtotal" numeric(12,2) not null, "iva" numeric(12,2) not null, "total" numeric(12,2) not null, "concepto" varchar(255) not null, "estado_id" int not null, "total_pagado" numeric(12,2) not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "factura_tenant_id_index" on "factura" ("tenant_id");`);
    this.addSql(`create index "factura_cliente_id_index" on "factura" ("cliente_id");`);
    this.addSql(`create index "factura_numero_tenant_id_index" on "factura" ("numero", "tenant_id");`);
    this.addSql(`create index "factura_tenant_id_estado_id_index" on "factura" ("tenant_id", "estado_id");`);

    this.addSql(`create table "empleado" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "nombre" varchar(255) not null, "apellido" varchar(255) not null, "cuil" varchar(13) not null, "fecha_ingreso" timestamptz not null, "fecha_egreso" timestamptz null, "sueldo_basico" numeric(12,2) not null, "categoria_convenio" varchar(255) not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "empleado_tenant_id_index" on "empleado" ("tenant_id");`);
    this.addSql(`create index "empleado_cliente_id_index" on "empleado" ("cliente_id");`);
    this.addSql(`create index "empleado_cuil_tenant_id_index" on "empleado" ("cuil", "tenant_id");`);

    this.addSql(`create table "documento" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "tipo_documento_id" int not null, "nombre" varchar(255) not null, "s3_key" varchar(255) not null, "mime_type" varchar(100) not null, "size_bytes" int not null, "version" int not null default 1, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "documento" add constraint "documento_s3_key_unique" unique ("s3_key");`);
    this.addSql(`create index "documento_tenant_id_index" on "documento" ("tenant_id");`);
    this.addSql(`create index "documento_cliente_id_index" on "documento" ("cliente_id");`);

    this.addSql(`create table "credencial_fiscal" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "organismo_id" int not null, "cuit" varchar(13) not null, "secret_arn" varchar(255) not null, "ultima_sincronizacion" timestamptz null, "estado" varchar(20) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "credencial_fiscal_tenant_id_index" on "credencial_fiscal" ("tenant_id");`);
    this.addSql(`create index "credencial_fiscal_cliente_id_index" on "credencial_fiscal" ("cliente_id");`);

    this.addSql(`create table "asiento_contable" ("id" uuid not null, "libro_id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "fecha" timestamptz not null, "descripcion" varchar(255) not null, "lineas" jsonb not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "asiento_contable_tenant_id_index" on "asiento_contable" ("tenant_id");`);
    this.addSql(`create index "asiento_contable_cliente_id_index" on "asiento_contable" ("cliente_id");`);
    this.addSql(`create index "asiento_contable_libro_id_index" on "asiento_contable" ("libro_id");`);
    this.addSql(`create index "asiento_contable_fecha_index" on "asiento_contable" ("fecha");`);

    this.addSql(`create table "usuario_estudio" ("id" uuid not null, "usuario_id" uuid not null, "estudio_id" uuid not null, "rol_id" int not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "usuario_estudio_usuario_id_estudio_id_index" on "usuario_estudio" ("usuario_id", "estudio_id");`);
    this.addSql(`create index "usuario_estudio_estudio_id_index" on "usuario_estudio" ("estudio_id");`);

    this.addSql(`create table "vencimiento" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "tipo_obligacion_id" int not null, "periodo" varchar(7) not null, "fecha_vencimiento" timestamptz not null, "descripcion" varchar(255) not null, "estado_id" int not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "vencimiento_tenant_id_index" on "vencimiento" ("tenant_id");`);
    this.addSql(`create index "vencimiento_cliente_id_index" on "vencimiento" ("cliente_id");`);
    this.addSql(`create index "vencimiento_fecha_vencimiento_index" on "vencimiento" ("fecha_vencimiento");`);
    this.addSql(`create index "vencimiento_tenant_id_estado_id_index" on "vencimiento" ("tenant_id", "estado_id");`);

    this.addSql(`alter table "estudio" add constraint "estudio_plan_id_foreign" foreign key ("plan_id") references "plan" ("id");`);

    this.addSql(`alter table "alerta_config" add constraint "alerta_config_tenant_id_foreign" foreign key ("tenant_id") references "estudio" ("id");`);

    this.addSql(`alter table "provincia" add constraint "provincia_pais_id_foreign" foreign key ("pais_id") references "pais" ("id");`);

    this.addSql(`alter table "localidad" add constraint "localidad_provincia_id_foreign" foreign key ("provincia_id") references "provincia" ("id");`);

    this.addSql(`alter table "rol_permiso" add constraint "rol_permiso_rol_id_foreign" foreign key ("rol_id") references "rol" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "rol_permiso" add constraint "rol_permiso_permiso_id_foreign" foreign key ("permiso_id") references "permiso" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "regla_vencimiento" add constraint "regla_vencimiento_tipo_obligacion_id_foreign" foreign key ("tipo_obligacion_id") references "tipo_obligacion" ("id");`);

    this.addSql(`alter table "usuario" add constraint "usuario_rol_id_foreign" foreign key ("rol_id") references "rol" ("id");`);

    this.addSql(`alter table "sesion" add constraint "sesion_usuario_id_foreign" foreign key ("usuario_id") references "usuario" ("id");`);

    this.addSql(`alter table "cliente" add constraint "cliente_condicion_iva_id_foreign" foreign key ("condicion_iva_id") references "condicion_iva" ("id");`);
    this.addSql(`alter table "cliente" add constraint "cliente_tipo_cliente_id_foreign" foreign key ("tipo_cliente_id") references "tipo_cliente" ("id");`);
    this.addSql(`alter table "cliente" add constraint "cliente_regimen_id_foreign" foreign key ("regimen_id") references "regimen" ("id");`);
    this.addSql(`alter table "cliente" add constraint "cliente_tenant_id_foreign" foreign key ("tenant_id") references "estudio" ("id");`);
    this.addSql(`alter table "cliente" add constraint "cliente_responsable_id_foreign" foreign key ("responsable_id") references "usuario" ("id") on delete set null;`);

    this.addSql(`alter table "tarea" add constraint "tarea_cliente_id_foreign" foreign key ("cliente_id") references "cliente" ("id") on delete set null;`);
    this.addSql(`alter table "tarea" add constraint "tarea_tenant_id_foreign" foreign key ("tenant_id") references "estudio" ("id");`);
    this.addSql(`alter table "tarea" add constraint "tarea_estado_id_foreign" foreign key ("estado_id") references "estado_tarea" ("id");`);
    this.addSql(`alter table "tarea" add constraint "tarea_prioridad_id_foreign" foreign key ("prioridad_id") references "prioridad" ("id");`);
    this.addSql(`alter table "tarea" add constraint "tarea_responsable_id_foreign" foreign key ("responsable_id") references "usuario" ("id") on delete set null;`);

    this.addSql(`alter table "notificacion_fiscal" add constraint "notificacion_fiscal_cliente_id_foreign" foreign key ("cliente_id") references "cliente" ("id");`);
    this.addSql(`alter table "notificacion_fiscal" add constraint "notificacion_fiscal_tenant_id_foreign" foreign key ("tenant_id") references "estudio" ("id");`);
    this.addSql(`alter table "notificacion_fiscal" add constraint "notificacion_fiscal_organismo_id_foreign" foreign key ("organismo_id") references "organismo_fiscal" ("id");`);

    this.addSql(`alter table "libro_contable" add constraint "libro_contable_cliente_id_foreign" foreign key ("cliente_id") references "cliente" ("id");`);
    this.addSql(`alter table "libro_contable" add constraint "libro_contable_tenant_id_foreign" foreign key ("tenant_id") references "estudio" ("id");`);
    this.addSql(`alter table "libro_contable" add constraint "libro_contable_tipo_libro_id_foreign" foreign key ("tipo_libro_id") references "tipo_libro" ("id");`);

    this.addSql(`alter table "factura" add constraint "factura_cliente_id_foreign" foreign key ("cliente_id") references "cliente" ("id");`);
    this.addSql(`alter table "factura" add constraint "factura_tenant_id_foreign" foreign key ("tenant_id") references "estudio" ("id");`);
    this.addSql(`alter table "factura" add constraint "factura_estado_id_foreign" foreign key ("estado_id") references "estado_factura" ("id");`);

    this.addSql(`alter table "empleado" add constraint "empleado_cliente_id_foreign" foreign key ("cliente_id") references "cliente" ("id");`);
    this.addSql(`alter table "empleado" add constraint "empleado_tenant_id_foreign" foreign key ("tenant_id") references "estudio" ("id");`);

    this.addSql(`alter table "documento" add constraint "documento_cliente_id_foreign" foreign key ("cliente_id") references "cliente" ("id");`);
    this.addSql(`alter table "documento" add constraint "documento_tenant_id_foreign" foreign key ("tenant_id") references "estudio" ("id");`);
    this.addSql(`alter table "documento" add constraint "documento_tipo_documento_id_foreign" foreign key ("tipo_documento_id") references "tipo_documento" ("id");`);

    this.addSql(`alter table "credencial_fiscal" add constraint "credencial_fiscal_cliente_id_foreign" foreign key ("cliente_id") references "cliente" ("id");`);
    this.addSql(`alter table "credencial_fiscal" add constraint "credencial_fiscal_tenant_id_foreign" foreign key ("tenant_id") references "estudio" ("id");`);
    this.addSql(`alter table "credencial_fiscal" add constraint "credencial_fiscal_organismo_id_foreign" foreign key ("organismo_id") references "organismo_fiscal" ("id");`);

    this.addSql(`alter table "asiento_contable" add constraint "asiento_contable_libro_id_foreign" foreign key ("libro_id") references "libro_contable" ("id");`);
    this.addSql(`alter table "asiento_contable" add constraint "asiento_contable_cliente_id_foreign" foreign key ("cliente_id") references "cliente" ("id");`);
    this.addSql(`alter table "asiento_contable" add constraint "asiento_contable_tenant_id_foreign" foreign key ("tenant_id") references "estudio" ("id");`);

    this.addSql(`alter table "usuario_estudio" add constraint "usuario_estudio_usuario_id_foreign" foreign key ("usuario_id") references "usuario" ("id");`);
    this.addSql(`alter table "usuario_estudio" add constraint "usuario_estudio_estudio_id_foreign" foreign key ("estudio_id") references "estudio" ("id");`);
    this.addSql(`alter table "usuario_estudio" add constraint "usuario_estudio_rol_id_foreign" foreign key ("rol_id") references "rol" ("id");`);

    this.addSql(`alter table "vencimiento" add constraint "vencimiento_cliente_id_foreign" foreign key ("cliente_id") references "cliente" ("id");`);
    this.addSql(`alter table "vencimiento" add constraint "vencimiento_tenant_id_foreign" foreign key ("tenant_id") references "estudio" ("id");`);
    this.addSql(`alter table "vencimiento" add constraint "vencimiento_tipo_obligacion_id_foreign" foreign key ("tipo_obligacion_id") references "tipo_obligacion" ("id");`);
    this.addSql(`alter table "vencimiento" add constraint "vencimiento_estado_id_foreign" foreign key ("estado_id") references "estado_vencimiento" ("id");`);
  }

}
