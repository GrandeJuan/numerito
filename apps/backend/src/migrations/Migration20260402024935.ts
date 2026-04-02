import { Migration } from '@mikro-orm/migrations';

export class Migration20260402024935 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "clientes" ("id" uuid not null, "cuit" varchar(13) not null, "razon_social" varchar(255) not null, "condicion_iva" varchar(50) not null, "tipo" varchar(50) not null, "regimen" varchar(50) not null, "tenant_id" uuid not null, "responsable_id" uuid null, "is_active" boolean not null default true, "provincias" jsonb not null default '[]', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "clientes_tenant_id_index" on "clientes" ("tenant_id");`);
    this.addSql(`create index "clientes_cuit_tenant_id_index" on "clientes" ("cuit", "tenant_id");`);
    this.addSql(`create index "clientes_responsable_id_index" on "clientes" ("responsable_id");`);

    this.addSql(`create table "documentos" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "tipo" varchar(50) not null, "nombre" varchar(255) not null, "s3_key" varchar(255) not null, "mime_type" varchar(100) not null, "size_bytes" int not null, "version" int not null default 1, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "documentos_tenant_id_index" on "documentos" ("tenant_id");`);
    this.addSql(`create index "documentos_cliente_id_index" on "documentos" ("cliente_id");`);
    this.addSql(`create index "documentos_s3_key_index" on "documentos" ("s3_key");`);

    this.addSql(`create table "empleados" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "nombre" varchar(255) not null, "apellido" varchar(255) not null, "cuil" varchar(13) not null, "fecha_ingreso" timestamptz not null, "fecha_egreso" timestamptz null, "sueldo_basico" numeric(12,2) not null, "categoria_convenio" varchar(255) not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "empleados_tenant_id_index" on "empleados" ("tenant_id");`);
    this.addSql(`create index "empleados_cliente_id_index" on "empleados" ("cliente_id");`);
    this.addSql(`create index "empleados_cuil_tenant_id_index" on "empleados" ("cuil", "tenant_id");`);

    this.addSql(`create table "estudios" ("id" uuid not null, "nombre" varchar(255) not null, "plan" varchar(50) not null, "max_clientes" int not null, "max_usuarios" int not null, "cuit" varchar(13) not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "estudios" add constraint "estudios_cuit_unique" unique ("cuit");`);

    this.addSql(`create table "facturas" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "numero" varchar(30) not null, "fecha_emision" timestamptz not null, "fecha_vencimiento" timestamptz not null, "subtotal" numeric(12,2) not null, "iva" numeric(12,2) not null, "total" numeric(12,2) not null, "concepto" varchar(255) not null, "estado" varchar(30) not null default 'EMITIDA', "total_pagado" numeric(12,2) not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "facturas_tenant_id_index" on "facturas" ("tenant_id");`);
    this.addSql(`create index "facturas_cliente_id_index" on "facturas" ("cliente_id");`);
    this.addSql(`create index "facturas_numero_tenant_id_index" on "facturas" ("numero", "tenant_id");`);
    this.addSql(`create index "facturas_tenant_id_estado_index" on "facturas" ("tenant_id", "estado");`);

    this.addSql(`create table "libros_contables" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "tipo" varchar(50) not null, "periodo" varchar(7) not null, "is_rubricado" boolean not null default false, "numero_rubrica" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "libros_contables_tenant_id_index" on "libros_contables" ("tenant_id");`);
    this.addSql(`create index "libros_contables_cliente_id_index" on "libros_contables" ("cliente_id");`);
    this.addSql(`create index "libros_contables_cliente_id_tipo_periodo_index" on "libros_contables" ("cliente_id", "tipo", "periodo");`);

    this.addSql(`create table "asientos_contables" ("id" uuid not null, "libro_id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "fecha" timestamptz not null, "descripcion" varchar(255) not null, "lineas" jsonb not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "asientos_contables_tenant_id_index" on "asientos_contables" ("tenant_id");`);
    this.addSql(`create index "asientos_contables_cliente_id_index" on "asientos_contables" ("cliente_id");`);
    this.addSql(`create index "asientos_contables_libro_id_index" on "asientos_contables" ("libro_id");`);
    this.addSql(`create index "asientos_contables_fecha_index" on "asientos_contables" ("fecha");`);

    this.addSql(`create table "notificaciones_fiscales" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "organismo_id" varchar(50) not null, "cuit_cliente" varchar(13) not null, "asunto" varchar(255) not null, "contenido" text not null, "fecha_notificacion" timestamptz not null, "estado" varchar(20) not null default 'PENDIENTE', "nota_gestion" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "notificaciones_fiscales_tenant_id_index" on "notificaciones_fiscales" ("tenant_id");`);
    this.addSql(`create index "notificaciones_fiscales_cliente_id_index" on "notificaciones_fiscales" ("cliente_id");`);
    this.addSql(`create index "notificaciones_fiscales_tenant_id_estado_index" on "notificaciones_fiscales" ("tenant_id", "estado");`);
    this.addSql(`create index "notificaciones_fiscales_fecha_notificacion_index" on "notificaciones_fiscales" ("fecha_notificacion");`);

    this.addSql(`create table "tareas" ("id" uuid not null, "titulo" varchar(255) not null, "descripcion" varchar(255) null, "cliente_id" uuid null, "tenant_id" uuid not null, "estado" varchar(20) not null default 'PENDIENTE', "prioridad" varchar(20) not null, "responsable_id" uuid null, "horas_registradas" numeric(8,2) not null default 0, "comentarios" jsonb not null default '[]', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "tareas_tenant_id_index" on "tareas" ("tenant_id");`);
    this.addSql(`create index "tareas_cliente_id_index" on "tareas" ("cliente_id");`);
    this.addSql(`create index "tareas_responsable_id_index" on "tareas" ("responsable_id");`);
    this.addSql(`create index "tareas_tenant_id_estado_index" on "tareas" ("tenant_id", "estado");`);

    this.addSql(`create table "usuarios" ("id" uuid not null, "email" varchar(255) not null, "password_hash" varchar(255) not null, "nombre" varchar(255) not null, "apellido" varchar(255) not null, "rol" varchar(50) not null, "is_active" boolean not null default true, "email_verified" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "usuarios" add constraint "usuarios_email_unique" unique ("email");`);

    this.addSql(`create table "sesiones" ("id" uuid not null, "usuario_id" uuid not null, "refresh_token" varchar(255) not null, "ip_address" varchar(255) not null, "user_agent" varchar(255) not null, "expires_at" timestamptz not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "sesiones_usuario_id_index" on "sesiones" ("usuario_id");`);

    this.addSql(`create table "usuario_estudios" ("id" uuid not null, "usuario_id" uuid not null, "estudio_id" uuid not null, "rol" varchar(50) not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "usuario_estudios_usuario_id_estudio_id_index" on "usuario_estudios" ("usuario_id", "estudio_id");`);
    this.addSql(`create index "usuario_estudios_estudio_id_index" on "usuario_estudios" ("estudio_id");`);

    this.addSql(`create table "vencimientos" ("id" uuid not null, "cliente_id" uuid not null, "tenant_id" uuid not null, "tipo_obligacion" varchar(50) not null, "periodo" varchar(7) not null, "fecha_vencimiento" timestamptz not null, "descripcion" varchar(255) not null, "estado" varchar(20) not null default 'PENDIENTE', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "vencimientos_tenant_id_index" on "vencimientos" ("tenant_id");`);
    this.addSql(`create index "vencimientos_cliente_id_index" on "vencimientos" ("cliente_id");`);
    this.addSql(`create index "vencimientos_fecha_vencimiento_index" on "vencimientos" ("fecha_vencimiento");`);
    this.addSql(`create index "vencimientos_tenant_id_estado_index" on "vencimientos" ("tenant_id", "estado");`);

    this.addSql(`alter table "asientos_contables" add constraint "asientos_contables_libro_id_foreign" foreign key ("libro_id") references "libros_contables" ("id");`);

    this.addSql(`alter table "sesiones" add constraint "sesiones_usuario_id_foreign" foreign key ("usuario_id") references "usuarios" ("id");`);

    this.addSql(`alter table "usuario_estudios" add constraint "usuario_estudios_usuario_id_foreign" foreign key ("usuario_id") references "usuarios" ("id");`);
  }

}
