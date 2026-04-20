# Ubiquitous Language — Numerito ERP Contable

## Actores y Acceso

| Término            | Definición                                                                                                         | Aliases a evitar              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| **Estudio**        | Firma contable que opera como tenant en el sistema SaaS                                                            | Tenant, organización, empresa |
| **Usuario**        | Identidad de autenticación con credenciales de login                                                               | Account, login, user          |
| **Socio**          | Rol de socio/dueño del estudio con acceso total                                                                    | Admin, owner                  |
| **Responsable**    | Rol de gerente/encargado que supervisa clientes                                                                    | Manager, supervisor           |
| **Empleado** (rol) | Rol de empleado del estudio con permisos limitados                                                                 | Staff, worker                 |
| **Sesión**         | Registro de login activo con refresh token y metadata de seguridad                                                 | Session, token                |
| **Superadmin**     | Rol de administrador global de la plataforma con acceso al panel de administración (no pertenece a ningún estudio) | Platform admin, god mode      |
| **Permiso**        | Capacidad específica asignada a un rol dentro de un estudio (ej: VER_FACTURACION)                                  | Permission, capability        |
| **Portal**         | Vista simplificada del sistema accesible solo por usuarios con rol Cliente                                         | Client portal, client view    |

## Clientes y Datos Fiscales

| Término              | Definición                                                                                    | Aliases a evitar            |
| -------------------- | --------------------------------------------------------------------------------------------- | --------------------------- |
| **Cliente**          | Persona física o jurídica atendida por el estudio contable                                    | Customer, cuenta, account   |
| **CUIT**             | Código Único de Identificación Tributaria — 11 dígitos con verificador                        | Tax ID, RUT, NIF            |
| **Razón Social**     | Nombre legal registrado de la entidad                                                         | Business name, company name |
| **Condición IVA**    | Situación fiscal del cliente frente al IVA (Responsable Inscripto, Monotributo, Exento, etc.) | VAT status                  |
| **Régimen**          | Régimen impositivo del cliente: General o Monotributo                                         | Tax regime                  |
| **Persona Física**   | Cliente individual o autónomo                                                                 | Individual                  |
| **Persona Jurídica** | Empresa o sociedad con personería jurídica                                                    | Company, corporation        |

## Obligaciones Fiscales

| Término                  | Definición                                                                                                                                                                              | Aliases a evitar               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Tipo de Obligación**   | Clase catalogada de obligación fiscal (IVA, Ganancias, F931, IIBB ARBA, etc.). Enum `TIPO_OBLIGACION`. Es la _clase_, no la instancia.                                                  | Impuesto, obligación (a secas) |
| **Vencimiento**          | Instancia agendable de un **Tipo de Obligación** para un **Cliente** en un **Período** dado, con `fechaVencimiento` y **Estado**.                                                       | Deadline, due date, obligation |
| **Regla de Vencimiento** | Regla del catálogo que calcula la **Fecha de Vencimiento** a partir del **Tipo de Obligación**, la terminación del **CUIT** y el **Período**. Campos: `diaVencimiento`, `mesSiguiente`. | Calendario, schedule           |
| **Fecha de Vencimiento** | Día calendario en que la presentación deja de estar a término.                                                                                                                          | Due date, fecha límite         |
| **Presentar**            | Acción del **Responsable**: marca un **Vencimiento** como cumplido ante el organismo. `PENDIENTE` → `PRESENTADO`. Emite evento `vencimiento-cumplido`.                                  | File, submit, cumplir          |
| **Marcar Vencido**       | Transición `PENDIENTE` → `VENCIDO` cuando pasa la **Fecha de Vencimiento** sin presentarse. Emite `vencimiento-vencido`.                                                                | Expirar                        |
| **Próximo a Vencer**     | **Vencimiento** en estado `PENDIENTE` cuya **Fecha de Vencimiento** cae dentro de N días (configurable).                                                                                | Alerta, warning                |
| **Vencido**              | Estado de un **Vencimiento** cuya fecha límite expiró sin presentación.                                                                                                                 | Overdue, expired               |
| **Pendiente**            | Estado de un **Vencimiento** aún no presentado ni vencido.                                                                                                                              | Pending                        |
| **Período**              | Unidad temporal (mes/trimestre/año fiscal) a la que corresponde la obligación. Formato `YYYY-MM` para mensuales.                                                                        | Period                         |
| **Alerta Config**        | Configuración del **Estudio** que define cuántos días antes se notifica un **Vencimiento** próximo.                                                                                     | Preferencia, setting           |
| **DDJJ**                 | Declaración Jurada — formulario de declaración impositiva                                                                                                                               | Tax return, filing             |
| **IIBB**                 | Ingresos Brutos — impuesto provincial sobre facturación                                                                                                                                 | Gross income tax               |

## Contabilidad

| Término              | Definición                                                                          | Aliases a evitar         |
| -------------------- | ----------------------------------------------------------------------------------- | ------------------------ |
| **Libro Contable**   | Registro legal obligatorio de transacciones (IVA Compras, IVA Ventas, Diario, etc.) | Ledger, accounting book  |
| **Rubricar**         | Registrar un libro ante la autoridad fiscal con número de rúbrica (irreversible)    | Stamp, certify, register |
| **Asiento Contable** | Registro de partida doble que vincula cambios en cuentas del plan contable          | Journal entry            |
| **Debe**             | Columna de débito en un asiento contable                                            | Debit                    |
| **Haber**            | Columna de crédito en un asiento contable                                           | Credit                   |
| **Balanceado**       | Un asiento donde total Debe == total Haber (dentro de tolerancia)                   | Balanced                 |

## Nómina

| Término                | Definición                                                                       | Aliases a evitar |
| ---------------------- | -------------------------------------------------------------------------------- | ---------------- |
| **Empleado** (entidad) | Trabajador en relación de dependencia de un cliente del estudio                  | Employee, worker |
| **CUIL**               | Código Único de Identificación Laboral — identificador tributario del trabajador | Labor tax ID     |
| **Sueldo Básico**      | Salario mensual base del empleado                                                | Base salary      |
| **Categoría Convenio** | Categoría dentro del convenio colectivo de trabajo que aplica al empleado        | Labor category   |
| **Dar de Baja**        | Registrar el egreso/despido de un empleado con fecha (irreversible)              | Terminate, fire  |
| **Antigüedad**         | Años de servicio calculados desde la fecha de ingreso                            | Seniority        |

## Facturación y Cobranzas

| Término              | Definición                                                                         | Aliases a evitar        |
| -------------------- | ---------------------------------------------------------------------------------- | ----------------------- |
| **Factura**          | Comprobante de venta emitido por el estudio a su cliente por servicios             | Invoice, bill           |
| **Línea de Factura** | Ítem individual dentro de una factura con cantidad, precio unitario y alícuota IVA | Invoice line, line item |
| **Pago**             | Registro de un cobro aplicado a una factura                                        | Payment                 |
| **Saldo Pendiente**  | Monto total de factura menos pagos recibidos                                       | Outstanding balance     |
| **Anular**           | Cancelar una factura (estado terminal, sin reversión)                              | Void, cancel            |
| **Cuenta Corriente** | Listado de facturas de un cliente mostrando saldos                                 | Account statement       |
| **Emitida**          | Factura creada pero aún sin pago                                                   | Issued                  |

## Documentos

| Término       | Definición                                                          | Aliases a evitar |
| ------------- | ------------------------------------------------------------------- | ---------------- |
| **Documento** | Archivo digital almacenado en S3, organizado por cliente y tipo     | File, attachment |
| **Versión**   | Revisión de un documento (auto-incrementada al subir nueva versión) | Revision         |

## Tareas y Gestión Interna

| Término             | Definición                                                                | Aliases a evitar       |
| ------------------- | ------------------------------------------------------------------------- | ---------------------- |
| **Tarea**           | Unidad de trabajo interno del estudio, puede estar vinculada a un cliente | Task, ticket, issue    |
| **Iniciar**         | Transicionar una tarea de Pendiente a En Progreso                         | Start, begin           |
| **Completar**       | Marcar una tarea como finalizada (solo desde En Progreso)                 | Finish, close, resolve |
| **Registrar Horas** | Agregar tiempo trabajado a una tarea (acumulativo)                        | Log time, track hours  |
| **Prioridad**       | Nivel de urgencia: Baja, Media, Alta, Urgente                             | Priority               |

## Notificaciones

| Término          | Definición                                                                                                                     | Aliases a evitar             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| **Notificación** | Aviso interno del sistema dirigido a un usuario sobre un evento relevante (vencimiento próximo, tarea asignada, pago recibido) | Alert, message, notification |
| **Leída**        | Estado de una notificación que el usuario ya vio y marcó como leída                                                            | Read, seen                   |

## Subscripción y Planes

| Término          | Definición                                                                           | Aliases a evitar         |
| ---------------- | ------------------------------------------------------------------------------------ | ------------------------ |
| **Subscripción** | Vínculo activo entre un estudio y un plan de precios                                 | Subscription, membership |
| **Plan**         | Nivel de servicio con límites de clientes y usuarios (Free, Profesional, Enterprise) | Tier, pricing plan       |
| **Trial**        | Período de prueba gratuito antes de activar un plan pago                             | Free trial               |
| **Suspender**    | Pausar temporalmente una subscripción activa (reversible)                            | Pause                    |
| **Reactivar**    | Reanudar una subscripción suspendida                                                 | Resume                   |
| **Renovar**      | Extender la fecha de fin de una subscripción                                         | Renew                    |

## Integraciones Fiscales

| Término                 | Definición                                                                             | Aliases a evitar           |
| ----------------------- | -------------------------------------------------------------------------------------- | -------------------------- |
| **ARCA**                | Administración de Recaudación y Control Aduanero (ex-AFIP) — organismo fiscal nacional | AFIP                       |
| **ARBA**                | Agencia de Recaudación de Buenos Aires — organismo fiscal provincial                   | Buenos Aires tax authority |
| **AGIP**                | Administración Gubernamental de Ingresos Públicos — organismo fiscal de CABA           | CABA tax authority         |
| **Notificación Fiscal** | Comunicación de un organismo fiscal dirigida a un cliente del estudio                  | Tax notice                 |
| **Gestionada**          | Estado de una notificación que ya fue atendida/resuelta con nota de gestión            | Handled, resolved          |

## Relaciones

- Un **Estudio** tiene muchos **Clientes**, **Usuarios** y una **Subscripción** activa
- Un **Cliente** pertenece a exactamente un **Estudio** y puede tener un **Responsable** asignado
- Un **Vencimiento** pertenece a un **Cliente** dentro de un **Estudio**, identificado por la tupla `(Cliente, Tipo de Obligación, Período)`
- Una **Regla de Vencimiento** se aplica a un **Tipo de Obligación** y una terminación de **CUIT**; calcula la **Fecha de Vencimiento** para un **Período**
- Un **Cliente** tiene cero o muchos **Vencimientos**; el **Régimen** y la **Condición IVA** determinan qué **Tipos de Obligación** le aplican
- Un **Libro Contable** contiene múltiples **Asientos Contables**
- Una **Factura** contiene una o más **Líneas de Factura** y puede recibir múltiples **Pagos**
- Un **Empleado** pertenece a un **Cliente** (es empleado del cliente, no del estudio)
- Una **Tarea** puede estar vinculada a un **Cliente** o ser general del **Estudio**
- Un **Usuario** puede pertenecer a múltiples **Estudios** con diferentes roles
- Un **Rol** en un **Estudio** otorga un conjunto de **Permisos** (configurable por estudio)
- Una **Notificación** pertenece a un **Usuario** y opcionalmente a un **Estudio**
- Un **Superadmin** no pertenece a ningún **Estudio** — opera a nivel plataforma

## Diálogo de ejemplo

> **Dev:** "Cuando un **Cliente** cambia de **Monotributo** a **Responsable Inscripto**, qué pasa con sus **Vencimientos**?"
> **Experto:** "Al cambiar la **Condición IVA**, los **Vencimientos** pendientes del período actual no se modifican. Pero a partir del próximo **Período**, se generan nuevos **Vencimientos** según las reglas del nuevo **Régimen** — por ejemplo, ahora tiene que **Presentar** DDJJ de IVA mensual."
> **Dev:** "Y si tiene un **Libro Contable** de IVA Compras ya **Rubricado**, se invalida?"
> **Experto:** "No. La **Rúbrica** es permanente. El libro sigue válido. Lo que cambia es que ahora necesita un libro de IVA Ventas también, porque como **Responsable Inscripto** debe discriminar IVA en sus **Facturas**."
> **Dev:** "Entonces el cambio de **Régimen** no afecta datos históricos, solo genera nuevas obligaciones futuras."
> **Experto:** "Exacto. Es un cambio prospectivo. Los **Asientos** ya registrados no se tocan."

## Ambigüedades flaggeadas

- **"Obligación" vs "Vencimiento"** — el bounded context se llama `obligaciones` pero la entidad central es `Vencimiento`. Criterio: **Tipo de Obligación** es la _clase_ fiscal catalogada; **Vencimiento** es la _instancia_ concreta agendable para un **Cliente** y **Período**. Nunca decir "la obligación de IVA de abril de ese cliente" — es un **Vencimiento**.

  **Regla para superficies de usuario y API pública:** decir siempre **Vencimientos**. El sidebar debe decir `Vencimientos`, la ruta `/vencimientos`, y la tabla mostrar "Vencimientos". El nombre `Obligaciones` se reserva exclusivamente al módulo backend y al bounded context DDD (agrupa calendario fiscal + reglas + eventos). Estado actual desalineado a corregir:
  - Sidebar → `Obligaciones` (debería ser `Vencimientos`)
  - Ruta frontend → `/obligaciones` (debería ser `/vencimientos`)
  - Endpoint público → `/v1/obligaciones/vencimientos` (redundante; ideal `/v1/vencimientos`, pero es breaking y conviene postergar)
  - Archivos frontend → `obligaciones-page.tsx`, `obligaciones/` (renombrar a `vencimientos-page.tsx`, `vencimientos/`)
  - El módulo backend `ObligacionesModule` puede quedarse como está — agrupa el contexto.

- **"Presentar" vs "Cumplido"** — el método de dominio es `presentar()` pero el evento se llama `vencimiento-cumplido`. Criterio: la _acción_ del **Responsable** es **Presentar**; el _hecho de dominio_ resultante es **Cumplido** (participio). Son dos términos deliberadamente distintos: imperativo vs pasado.
- **"Empleado"** se usa para dos conceptos distintos: (1) el rol de **Usuario** dentro del estudio (`ROL.EMPLEADO`), y (2) la entidad **Empleado** que representa un trabajador de un cliente para nómina. Son conceptos completamente diferentes — el primero es un rol de acceso, el segundo es un dato de RRHH.
- **"Vencido/a"** se usa en tres contextos: **Vencimiento** vencido (obligación fiscal no presentada a tiempo), **Factura** vencida (no pagada al vencer), y **Subscripción** vencida (período expirado). Aunque comparten el término, los estados y transiciones son diferentes en cada caso.
- **"Pendiente"** aparece en **Vencimientos**, **Tareas** y **Notificaciones** con semánticas ligeramente diferentes: en vencimientos significa "no presentado", en tareas significa "no iniciado", en notificaciones significa "no leída".
- **"Cliente"** como rol (`ROL.CLIENTE` para acceso al portal) vs **Cliente** como entidad del dominio (persona/empresa atendida por el estudio). El primero es un tipo de usuario, el segundo es la entidad central del negocio.
- **"Estudio" en el dashboard** — el mensaje "Seleccione un estudio para ver el dashboard" es confuso porque el usuario ya está autenticado y puede pertenecer a un solo estudio. El concepto de "seleccionar estudio" es multi-tenancy (un usuario puede ser Socio en un estudio y Empleado en otro). No es "seleccionar qué estudio usar" en el sentido de crear uno, sino "en cuál de mis estudios quiero trabajar ahora". Mejor redacción: "Seleccione en cuál de sus estudios desea trabajar" o auto-seleccionar cuando hay uno solo.
- **"Notificación"** se usa para dos cosas: (1) **Notificación** interna del sistema (aviso de vencimiento, tarea asignada — bounded context Notificaciones), y (2) **Notificación Fiscal** (comunicación de ARCA/ARBA dirigida a un cliente — bounded context Integraciones). Son conceptos completamente distintos.
