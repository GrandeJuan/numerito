# Vencimientos — Domain Model (draft)

Basado en `_docs/vencimientos-viabilidad-tecnica.md` y las decisiones del socio:

- Prioridad: notificar al cliente vía portal + email.
- Make, no buy (sin AFIP SDK).
- Scraping de `seti.afip.gob.ar` para calendario oficial.
- Onboarding de delegación AFIP a diseñar.
- Municipales postergados.

Estado actual: el contexto `obligaciones` ya tiene `Vencimiento` + `ReglaVencimiento` + eventos `VencimientoCumplido` / `VencimientoVencido`. El modelo existente es **demasiado pobre** para lo que necesitamos. Abajo el lenguaje y el modelo propuestos.

---

## 1. Lenguaje ubicuo (español de negocio)

| Término                      | Definición                                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Obligación**               | Deber fiscal/societario abstracto al que está sujeto un contribuyente (ej. "IVA mensual"). Es el catálogo, no una instancia.                    |
| **TipoObligación**           | Código canónico de la obligación (`IVA`, `SICOSS`, `IIBB_CABA_LOCAL`, `CITI_COMPRAS`, `BALANCE_PDF`, etc.).                                     |
| **Jurisdicción**             | Organismo recaudador que define la obligación: `ARCA`, `ARBA`, `AGIP`, `CONVENIO_MULTILATERAL`, `MUNICIPIO_{id}`.                               |
| **RégimenFiscal**            | Condición del contribuyente ante la jurisdicción: `RESPONSABLE_INSCRIPTO`, `MONOTRIBUTO`, `EXENTO`, `AGENTE_RETENCION`, `REGIMEN_SIMPLIFICADO`. |
| **PerfilFiscal del cliente** | Conjunto `(jurisdicción × régimen)` en el que el cliente está inscripto. Determina qué obligaciones le aplican.                                 |
| **ReglaVencimiento**         | Función `(tipo × terminación_cuit × régimen × jurisdicción × vigencia) → (diaCalendario, referencia_mes)`. Versionada.                          |
| **Período fiscal**           | Mes/año al que corresponde la obligación (`2026-03`). Para anuales, el año fiscal.                                                              |
| **Vencimiento proyectado**   | Instancia concreta `(cliente × tipoObligación × período × fechaCalendario × fechaAjustada)` generada al aplicar reglas al perfil del cliente.   |
| **Calendario del mes**       | Conjunto de vencimientos proyectados de un cliente para un mes dado. Artefacto entregable al cliente.                                           |
| **Día hábil**                | Día que no es feriado nacional, bancario ni provincial aplicable a la jurisdicción del vencimiento.                                             |
| **Feriado**                  | Día no laborable de un calendario (nacional/bancario/provincial/municipal).                                                                     |
| **Ajuste día hábil**         | Regla: si `fechaCalendario` cae en no-hábil, se corre al siguiente hábil de la jurisdicción.                                                    |
| **Responsable**              | Colaborador del estudio asignado al cliente para hacerse cargo de sus presentaciones.                                                           |
| **Presentación**             | Acto de cumplir con la obligación (DJ enviada, pago hecho, etc.). Cambia el estado del vencimiento a `PRESENTADO`.                              |
| **Alerta/Recordatorio**      | Evento programado que notifica (email/portal) la proximidad de un vencimiento.                                                                  |
| **CatálogoOficial**          | Fuente de verdad externa (scraping ARCA, ARBA HTML/ICS, AGIP) de la que se derivan las reglas.                                                  |

**Ambigüedad a resolver:** ¿`Obligación` y `TipoObligación` son lo mismo o dos cosas? Propuesta: `TipoObligacion` es el enum/VO, `CatalogoObligacion` es la entidad administrativa (nombre para mostrar, jurisdicción, frecuencia, activa/no). El `Vencimiento` referencia al `TipoObligacion`.

---

## 2. Brechas del modelo actual

| Gap                                              | Impacto                                                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `ReglaVencimiento` ignora **régimen fiscal**     | Monotributista y RI vencen en fechas distintas → el modelo está sub-especificado.               |
| `ReglaVencimiento` ignora **jurisdicción**       | No se puede representar IIBB PBA vs IIBB CABA vs IVA nacional.                                  |
| No hay **vigencia** en la regla                  | Cuando ARCA cambia el calendario 2027, se pisa el 2026 y perdemos historia.                     |
| No hay **ajuste por día hábil**                  | Ver `vencimiento.entity.ts` — la fecha es la nominal, sin corrimiento por feriado.              |
| No hay **PerfilFiscal del cliente**              | No se sabe qué obligaciones aplican a cada cliente. Hoy los `Vencimiento` se crean manualmente. |
| No hay **proyector de calendario**               | No existe job que dado (cliente × mes) genere todos los vencimientos esperados.                 |
| No hay **calendario de feriados**                | Dato auxiliar necesario para el ajuste.                                                         |
| No hay **ingesta del catálogo oficial**          | Las reglas hoy se cargan a mano.                                                                |
| No hay **notificación al cliente**               | `NotificacionVencimientoService` existe pero no se ve canal portal+email dirigido al cliente.   |
| No hay **responsable** asignado al `Vencimiento` | Se necesita para la planilla por responsable que pidió el socio.                                |

---

## 3. Modelo propuesto

### 3.1 Distribución por bounded context

| Concepto                                                                      | Contexto                                   | Motivo                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `CatalogoObligacion`, `TipoObligacion`, `Jurisdiccion`, `RegimenFiscal` (VOs) | `obligaciones`                             | Lenguaje nuclear del dominio.                                    |
| `ReglaVencimiento` (versionada)                                               | `obligaciones`                             | Regla de negocio del dominio.                                    |
| `Vencimiento` (proyectado)                                                    | `obligaciones`                             | Aggregate root ya existente, se extiende.                        |
| `PerfilFiscal` del cliente                                                    | `clientes`                                 | Extensión del cliente: jurisdicciones + regímenes + responsable. |
| `CalendarioFeriados`                                                          | `shared` o nuevo contexto `calendario`     | Utilitario cross-cutting.                                        |
| `IngestaCatalogoOficial` (scraping ARCA/ARBA/AGIP)                            | `integraciones`                            | Adapter externo por diseño.                                      |
| `NotificacionCliente` (email + portal)                                        | `notificaciones` (o `portal` para el feed) | Canal, no dominio fiscal.                                        |
| Proyector `(cliente × mes) → Vencimientos`                                    | `obligaciones/application`                 | Caso de uso que coordina reglas + perfil + feriados.             |

### 3.2 Entidades, value objects y aggregates

#### Contexto `obligaciones`

**Value Objects:**

- `Jurisdiccion` — enum cerrado: `ARCA`, `ARBA`, `AGIP`, `CONVENIO_MULTILATERAL`, `MUNICIPIO_{codigo}` (diferido).
- `TipoObligacion` — enum extensible (hoy ya existe en `@numerito/shared`). Pertenece a una jurisdicción.
- `RegimenFiscal` — enum: `RESPONSABLE_INSCRIPTO`, `MONOTRIBUTO`, `EXENTO`, `AGENTE_RETENCION`, `REGIMEN_SIMPLIFICADO`.
- `PeriodoFiscal` — VO `{ anio, mes }` con validación y operaciones (`siguienteMes`, `equals`).
- `TerminacionCuit` — VO `{ digito: '0'..'9' }` derivable de un CUIT.
- `FechaHabil` — VO que encapsula el ajuste `{ fechaNominal, fechaAjustada, jurisdiccion }`.

**Entidades:**

- `CatalogoObligacion` (nuevo) — `{ id, tipoObligacion, jurisdiccion, nombre, frecuencia (MENSUAL|ANUAL|EVENTUAL), activo }`.
  - Catálogo administrable por el socio del estudio (con templates preseed).
- `ReglaVencimiento` (extender el existente) — `{ id, tipoObligacion, jurisdiccion, regimen, terminacionCuit, diaVencimiento, mesSiguiente, vigenciaDesde, vigenciaHasta }`.
  - Invariante: al resolver, se elige la regla vigente cuyo `(vigenciaDesde, vigenciaHasta)` contenga la fecha de resolución. **Nunca dos reglas vigentes para el mismo tuple.**
  - Origen: `MANUAL` | `SCRAPING_OFICIAL` | `IMPORTACION`.
- `Vencimiento` (aggregate root — ya existe, extender) — agregar `responsableId`, `jurisdiccion`, `fechaNominal`, `fechaAjustada`, `origenRegla (id)`.
  - Estados: `PENDIENTE` → `PRESENTADO` | `VENCIDO` | `PRORROGADO` | `N/A`.
  - Transición nueva: `prorrogar(nuevaFecha, motivo)` — cuando ARCA extiende un vencimiento.
  - Transición nueva: `marcarNoAplica(motivo)` — cuando el perfil del cliente cambia y ya no aplica.

**Servicios de dominio:**

- `ReglaVencimientoService.calcularFecha(perfil, tipoObligacion, periodo) → FechaHabil` — reemplaza al servicio actual; toma el `PerfilFiscal` completo.
- `AjusteDiaHabilService.ajustar(fecha, jurisdiccion) → Date` — delega en `CalendarioFeriados`.

**Eventos de dominio (públicos):**

- `obligaciones.vencimiento-proyectado` (nuevo) — emitido al crear un `Vencimiento` desde el proyector. Payload: `{ vencimientoId, clienteId, estudioId, tipoObligacion, periodo, fechaAjustada, responsableId }`. Suscriptor: `notificaciones` (programa recordatorios).
- `obligaciones.vencimiento-cumplido` (existe) — sin cambios.
- `obligaciones.vencimiento-vencido` (existe) — sin cambios.
- `obligaciones.vencimiento-prorrogado` (nuevo) — cuando se aplica una prórroga oficial.
- `obligaciones.calendario-mensual-listo` (nuevo) — emitido cuando el proyector terminó un `(clienteId, periodoFiscal)`. Dispara el envío del calendario mensual al cliente.

#### Contexto `clientes`

**Value Objects nuevos:**

- `PerfilFiscal` — `{ cuit, categoriaARCA: RegimenFiscal, inscripciones: InscripcionJurisdiccion[], responsableId }`.
- `InscripcionJurisdiccion` — `{ jurisdiccion, regimen, numeroInscripcion?, activa, desde, hasta? }`.

**Extensión del aggregate `Cliente`:**

- Agregar `perfilFiscal`.
- Comandos: `actualizarPerfilFiscal(...)`, `inscribirEnJurisdiccion(...)`, `darDeBajaInscripcion(...)`, `asignarResponsable(...)`.
- Evento público: `clientes.perfil-fiscal-actualizado` — dispara re-proyección del calendario vigente.

#### Contexto nuevo `calendario` (o en `shared`)

**Entidad:**

- `DiaFeriado` — `{ fecha, tipo: NACIONAL|BANCARIO|PROVINCIAL|MUNICIPAL, jurisdiccionAfectada }`.
- Repositorio `FeriadoRepository.esHabil(fecha, jurisdiccion): boolean` + `siguienteHabil(fecha, jurisdiccion): Date`.
- Fuente: ingesta anual desde `argentinadatos.com` (nacional) + BCRA PDF (bancario) + carga manual (provincial).

#### Contexto `integraciones`

**Servicios (adapters):**

- `ScraperCalendarioARCA` — scrapea `seti.afip.gob.ar/av/seleccionVencimientos.do`. Produce `ReglaVencimientoPropuesta[]` para revisión humana antes de activar.
- `ScraperCalendarioARBA` — idem con HTML + ICS de ARBA.
- `ScraperCalendarioAGIP` — idem.
- `IngestaFeriadosService` — consume `argentinadatos.com` (anual).

**Scope global, no por tenant:** el calendario oficial es el mismo para todos los estudios. Las `ReglaVencimiento` ingestadas son datos de referencia globales, vía `GlobalRepository`. No se asocian a ningún `estudioId`.

**Flujo de aprobación:** las reglas scrapeadas entran en estado `PROPUESTA` y requieren aprobación de un superadmin antes de pasar a `ACTIVA`. Evita que un cambio en el HTML rompa el calendario productivo.

**Entidad nueva:**

- `ConfiguracionIngestaCatalogo` — `{ id, fuente: ARCA|ARBA|AGIP|FERIADOS, habilitado, cadenciaDias, proximaEjecucion, ultimaEjecucion, ultimoResultado }`.
  - Alcance: global. CRUD sólo para superadmin (rol a nivel SaaS, no a nivel estudio).
  - Default propuesto: `cadenciaDias=7` para ARCA/ARBA/AGIP, `cadenciaDias=30` para feriados. Confirmar con el socio.

**Entidad nueva:**

- `EjecucionIngesta` — `{ id, configuracionId, inicio, fin, estado: OK|FALLIDA|PARCIAL, reglasNuevas, reglasModificadas, reglasSinCambios, errores[], disparador: SCHEDULE|MANUAL, disparadoPor? }`.
  - Audit trail de cada corrida. Inspeccionable desde el panel superadmin.

### 3.4 Infraestructura de ingesta (AWS)

El scraping **no corre dentro del backend NestJS**. Es una Lambda independiente disparada por schedule.

```
EventBridge rule (cron)  →  Lambda scraper-calendario  →  POST /internal/ingesta/ejecutar  →  Backend NestJS
       ↑                           ↓
       │                    CloudWatch logs + métricas
       │
  ConfiguracionIngestaCatalogo
  (leída para decidir si corre
  y qué fuentes procesar)
```

**Diseño:**

- **Lambda `scraper-calendario`** (Node 20, handler único) — recibe `{ fuente, trigger }`, ejecuta el scraping HTTP (playwright o cheerio según fuente), postea el resultado al backend en un endpoint interno autenticado con secret.
- **EventBridge rule** por fuente (`scraper-calendario-arca`, `-arba`, `-agip`, `-feriados`) con expresión cron generada desde `ConfiguracionIngestaCatalogo.cadenciaDias`. Cambio de cadencia → update de la rule via SDK.
- **Actualización de la rule**: cuando el superadmin edita la cadencia en el panel, el backend llama a `PutRule` de EventBridge (o a un step function) para sincronizar.
- **Disparo manual**: endpoint admin `POST /admin/ingesta/:fuente/ejecutar-ahora` dispara la Lambda de forma sincrónica. Útil para QA y para cuando ARCA publica un cambio urgente.
- **Idempotencia**: la Lambda envía un `ingestaId` único por ejecución. El backend descarta ejecuciones duplicadas (EventBridge puede reintentar).
- **Retry**: EventBridge reintenta con backoff exponencial ante fallo; tras N intentos se emite alarma CloudWatch → SNS → email al superadmin.
- **Rate limiting**: el scraper respeta `robots.txt` y espacia requests (N ms entre GETs) para no cargar los servers oficiales.
- **Observabilidad**: cada `EjecucionIngesta` registra duración, filas parseadas, diff contra estado anterior. Métricas en CloudWatch.
- **Terraform**: agregar en `infra/` la Lambda + IAM role + EventBridge rules + CloudWatch alarms. Encaja con el stack AWS ya declarado en `CLAUDE.md`.

**Por qué Lambda y no un cron del backend:**

- Scraping puede tardar minutos y no debe competir por recursos con el API productivo.
- Aislamiento de dependencias (playwright/chromium pesa) — no lo queremos en la imagen Docker del API.
- Costo: la Lambda se factura por segundo de ejecución; correrla 1×/día vs mantener un worker always-on.
- Si el scraper rompe (OOM, timeout), no tumba el backend.

#### Contexto `notificaciones` (o `portal`)

**Servicios de aplicación:**

- `ProgramadorRecordatoriosService` — al recibir `vencimiento-proyectado`, programa alertas según `AlertaConfig` del cliente (ya existe `alerta-config.schema.ts`).
- `EnviadorCalendarioMensualService` — al recibir `calendario-mensual-listo`, arma el PDF + email + item en el portal del cliente.

**Canales:**

- `EmailChannel` (SMTP/SES).
- `PortalInboxChannel` (feed del cliente en el portal).

### 3.3 Casos de uso (application layer en `obligaciones`)

1. **`ProyectarCalendarioMensualCommand(estudioId, clienteId, periodo)`** — caso de uso central.
   - Lee `PerfilFiscal` del cliente.
   - Para cada `(jurisdicción × régimen)` inscripto, busca los `CatalogoObligacion` aplicables.
   - Para cada uno, aplica `ReglaVencimientoService.calcularFecha` vigente.
   - Ajusta por día hábil.
   - Crea `Vencimiento`s (upsert idempotente sobre `cliente × tipo × periodo`).
   - Emite `calendario-mensual-listo` al final.
2. **`ProyectarCalendarioMasivoCommand(estudioId, periodo)`** — batch de todos los clientes del estudio. Job cron mensual.
3. **`PresentarVencimientoCommand`** — ya existe.
4. **`MarcarVencidoCommand`** — ya existe (probablemente cron diario).
5. **`ProrrogarVencimientoCommand(vencimientoId, nuevaFecha, motivo)`** — nuevo.
6. **`AprobarReglaScrapeadaCommand(propuestaId)`** — admin.
7. **`ReproyectarCalendarioPorCambioDePerfilCommand(clienteId)`** — listener de `perfil-fiscal-actualizado`.

---

## 4. Invariantes clave

1. Un `Vencimiento` pertenece a un único `(clienteId, estudioId, tipoObligacion, periodo)` — clave única.
2. No se puede `presentar` un `Vencimiento` cuyo `estado = VENCIDO` sin pasar antes por alguna excepción explícita (revisar con el socio).
3. `fechaNominal ≤ fechaAjustada`, siempre.
4. `fechaAjustada` **siempre** es día hábil de la jurisdicción del tipo.
5. Para un `(tipoObligacion, jurisdiccion, regimen, terminacionCuit)` nunca hay 2 `ReglaVencimiento` con vigencias solapadas.
6. Una `InscripcionJurisdiccion` del perfil del cliente no puede estar `activa=false` y usarse para proyectar vencimientos nuevos.
7. Si se cambia el `perfilFiscal` del cliente, los `Vencimiento` futuros (no presentados) deben re-proyectarse. Los pasados no se tocan.

---

## 5. Qué no modela este draft (deliberadamente)

- **Delegación AFIP**: fase 2/3. Vive en `iam` + `integraciones` cuando se implemente.
- **WSCCOMU / DFE**: fase 3.
- **Padrón ARCA**: fase 2.
- **Municipios**: diferido.
- **Recibos de sueldos**: fuera del scope de "vencimientos" — entra en `nómina`.
- **Balance PDF**: aparece en el Excel pero más cerca de `documentos` que de `obligaciones` — abrir ticket.

---

## 6. Preguntas al socio antes de pasar al PRD

1. **Prórroga / no-aplica**: ¿cuál es el flujo real cuando ARCA extiende un vencimiento? ¿Lo registra el responsable manual o lo scrapeamos?
2. **Responsable**: ¿uno solo por cliente o uno por `TipoObligacion` (ej. un responsable de IIBB y otro de sueldos)? Afecta la granularidad de asignación.
3. **Calendario al cliente**: ¿mensual consolidado (1 email a fin de mes) o por vencimiento (email al proyectar + recordatorio X días antes)? Los dos son implementables pero cambian el UX.
4. **Aprobación de reglas scrapeadas**: ¿quién aprueba (socio del estudio, admin del SaaS, nadie y confiamos)? Impacta cuánto UI admin construimos.
5. **Versión de RegimenFiscal**: ¿un cliente puede estar en Monotributo y también ser Agente de Retención en CABA? Si sí, el `PerfilFiscal` son N inscripciones independientes; si no, simplificamos.
6. **Feriados bancarios vs nacionales**: muchos vencimientos AFIP se mueven por feriado bancario (no nacional). ¿Quién mantiene ese calendario en producto? ¿Lo cargamos manualmente del BCRA cada año?
7. **Cadencia default de ingesta**: propuesta inicial `cadenciaDias=7` para ARCA/ARBA/AGIP y `cadenciaDias=30` para feriados. ¿Te sirve ese default o querés diario? Impacta costo Lambda y exposición a cambios.
8. **Superadmin**: ¿el rol ya existe en `iam` o hay que crearlo? El panel de `ConfiguracionIngestaCatalogo` y aprobación de reglas es el primer feature que lo necesita.

---

## 7. Próximos pasos sugeridos

1. Iterar este doc con el socio (resolver § 6).
2. Fijar los VOs `Jurisdiccion`, `RegimenFiscal`, `TipoObligacion` en `packages/shared`.
3. Migración: extender `ReglaVencimientoEntity` con `jurisdiccion`, `regimen`, `vigencia`.
4. Escribir el PRD con tracer bullets: `(cliente con perfil mínimo) → (1 regla ARCA IVA) → (proyección) → (email al cliente)` end-to-end, antes de expandir al resto de tipos/jurisdicciones.
