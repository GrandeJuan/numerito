# PRD — Calendario de Vencimientos y Notificación a Clientes

## Problem Statement

El estudio contable Pini gestiona hoy los vencimientos impositivos de cada uno de sus clientes con un Excel mensual mantenido a mano por cada responsable del equipo. Este formato tiene cuatro dolores graves:

- **Para los colaboradores del estudio**, armar y mantener la planilla consume horas operativas cada mes y es propenso a errores de copia.
- **Para los socios**, no hay visibilidad en tiempo real del cumplimiento: "si no se efectúa la presentación, nos enteramos después de vencido". El seguimiento del equipo depende de la proximidad física.
- **Para los clientes del estudio**, los vencimientos llegan por email manual: los pierden, los solicitan de nuevo, o no los ven a tiempo. No hay un canal confiable.
- **Para el estudio en su conjunto**, cada cambio en la grilla oficial (AFIP/ARCA, ARBA, AGIP, Comisión Arbitral) obliga a rehacer planillas y arriesga inconsistencias entre responsables.

No existe una herramienta en el producto que resuelva esto end-to-end. El contexto `obligaciones` tiene un modelo mínimo (`Vencimiento` + `ReglaVencimiento`) que no contempla régimen fiscal, jurisdicción, vigencia ni ajuste por día hábil, y los vencimientos se crean manualmente.

## Solution

Un módulo de **Calendario de Vencimientos** que:

1. **Mantiene un catálogo de reglas de vencimiento versionado** que se hidrata automáticamente desde las fuentes oficiales (ARCA vía `seti.afip.gob.ar/av/`, ARBA, AGIP), con aprobación de un superadmin antes de activar cambios.
2. **Proyecta automáticamente el calendario mensual** de cada cliente aplicando las reglas a su perfil fiscal (jurisdicciones, regímenes, terminación de CUIT) y ajustando por días hábiles (feriados nacionales + bancarios + provinciales).
3. **Notifica al cliente por portal y email** en modelo híbrido: un PDF consolidado al inicio del mes + recordatorios individuales X días antes de cada vencimiento.
4. **Ofrece al estudio una planilla por responsable** con vista de cumplimiento, alertas de próximos a vencer y marcación de "presentado" / "prorrogado" / "no aplica".
5. **Detecta prórrogas oficiales** vía scraping y sugiere actualizaciones al responsable, quien las aprueba.
6. **Es multi-tenant**: cada estudio ve solo sus clientes; las reglas del calendario oficial son datos globales compartidos.

El resultado desde la óptica del usuario:

- **El socio** entra al dashboard y ve cuántos vencimientos del mes están pendientes, en riesgo, o cumplidos, filtrado por responsable.
- **El responsable** abre su planilla mensual, filtra por cliente o tipo de obligación, y marca presentaciones con un click.
- **El cliente final** recibe a fin de mes un PDF con el calendario de sus próximos 30 días y un email recordatorio 3 días antes de cada vencimiento, con link al portal donde ve todo consolidado.
- **El superadmin del SaaS** revisa las reglas scrapeadas que cambiaron, las aprueba o rechaza, y puede ajustar la cadencia de scraping por fuente.

## User Stories

### Cliente del estudio (cuenta en el portal)

1. Como **cliente del estudio**, quiero recibir a principios de mes un PDF por email con todos mis vencimientos del mes, para planificar mis pagos y presentaciones con anticipación.
2. Como **cliente del estudio**, quiero recibir un email recordatorio 3 días antes de cada vencimiento, para no perder plazos.
3. Como **cliente del estudio**, quiero ver en mi portal un feed con los próximos vencimientos ordenados por fecha, para consultarlos cuando quiera sin depender del email.
4. Como **cliente del estudio**, quiero ver el histórico de vencimientos presentados y pendientes, para auditar mi cumplimiento fiscal.
5. Como **cliente del estudio**, quiero poder reenviarme el PDF consolidado desde el portal, para no tener que pedírselo al estudio por email.
6. Como **cliente del estudio**, quiero que cada vencimiento indique la jurisdicción, tipo de impuesto, período y fecha ajustada por día hábil, para entender exactamente qué tengo que presentar.
7. Como **cliente del estudio**, quiero poder configurar cuántos días antes recibir los recordatorios, para adaptarlo a mi operatoria.

### Responsable del estudio

8. Como **responsable del estudio**, quiero ver mi planilla mensual filtrada por mis clientes asignados, para trabajar sobre mi propio alcance sin distracción.
9. Como **responsable del estudio**, quiero marcar un vencimiento como "presentado" con un click, para que el dashboard refleje mi avance.
10. Como **responsable del estudio**, quiero registrar una prórroga con motivo y nueva fecha, para reflejar los cambios oficiales cuando ARCA los publica.
11. Como **responsable del estudio**, quiero recibir una alerta interna (email + portal staff) cuando un vencimiento de mis clientes queda a 48hs sin presentar, para actuar antes de que venza.
12. Como **responsable del estudio**, quiero ver qué vencimientos de un cliente quedan pendientes después de un cambio en su perfil fiscal, para re-verificar el alta.
13. Como **responsable del estudio**, quiero marcar un vencimiento como "no aplica" con motivo, para limpiar la planilla cuando el perfil del cliente dejó de aplicar esa obligación.
14. Como **responsable del estudio**, quiero exportar mi planilla mensual a Excel, para compartirla con el equipo en flujos que hoy todavía viven en planillas.
15. Como **responsable del estudio**, quiero ver una sugerencia automática cuando el scraper detectó una prórroga oficial para un vencimiento de mis clientes, para aceptarla o descartarla.

### Socio del estudio

16. Como **socio del estudio**, quiero un dashboard con el porcentaje de cumplimiento mensual por responsable, para detectar cuellos de botella en el equipo.
17. Como **socio del estudio**, quiero ver cuántos vencimientos están en riesgo (menos de N días y pendientes), para priorizar la intervención.
18. Como **socio del estudio**, quiero filtrar el dashboard por jurisdicción, tipo de obligación o cliente, para responder preguntas puntuales.
19. Como **socio del estudio**, quiero configurar el perfil fiscal de un cliente al alta (jurisdicciones, regímenes, responsable), para que el calendario se proyecte correctamente desde el primer mes.
20. Como **socio del estudio**, quiero que el responsable por defecto de un cliente herede todos sus vencimientos, pero poder reasignar tipos de obligación puntuales a otro colaborador, para reflejar especializaciones del equipo.
21. Como **socio del estudio**, quiero ver los clientes que no tienen perfil fiscal configurado, para completar el onboarding.
22. Como **socio del estudio**, quiero importar la planilla Excel histórica del estudio, para arrancar con datos reales sin carga manual.

### Superadmin del SaaS

23. Como **superadmin del SaaS**, quiero configurar la cadencia de scraping por fuente oficial, para balancear costo de infraestructura y frescura del calendario.
24. Como **superadmin del SaaS**, quiero disparar manualmente un scraping on-demand, para cubrir cambios urgentes publicados por ARCA fuera de la cadencia.
25. Como **superadmin del SaaS**, quiero revisar las reglas scrapeadas en estado PROPUESTA con diff contra la versión activa, para aprobarlas o rechazarlas antes de que impacten a todos los estudios.
26. Como **superadmin del SaaS**, quiero ver el historial de ejecuciones de scraping con estado, duración, reglas procesadas y errores, para auditar el pipeline.
27. Como **superadmin del SaaS**, quiero recibir una alerta cuando un scraper falla N veces consecutivas, para intervenir antes de que se desactualice el calendario.
28. Como **superadmin del SaaS**, quiero cargar manualmente el calendario de feriados bancarios del BCRA cada año, para complementar al scraper anual del BCRA.
29. Como **superadmin del SaaS**, quiero poder corregir a mano una regla con vigencia futura, para arreglar un parseo erróneo sin esperar el próximo scraping.
30. Como **superadmin del SaaS**, quiero habilitar/deshabilitar una fuente de scraping, para ponerla en pausa mientras se arregla un cambio en el HTML oficial.

### Sistema / procesos

31. Como **sistema**, quiero proyectar automáticamente el calendario de cada cliente el día 1 de cada mes, para que el estudio y el cliente tengan la planilla lista al inicio del período.
32. Como **sistema**, quiero re-proyectar los vencimientos futuros de un cliente cuando cambia su perfil fiscal, para reflejar el nuevo alcance sin intervención manual.
33. Como **sistema**, quiero marcar un vencimiento como VENCIDO cuando la fecha ajustada pasó y sigue PENDIENTE, para que la alerta aparezca en el dashboard del responsable.
34. Como **sistema**, quiero emitir eventos de dominio (vencimiento-proyectado, calendario-mensual-listo, vencimiento-prorrogado) para que los suscriptores (notificaciones, read-models del dashboard) reaccionen desacopladamente.
35. Como **sistema**, quiero evitar proyectar vencimientos duplicados al re-ejecutar, para que el proceso sea idempotente.

## Implementation Decisions

### Módulos deep a construir / modificar

**A. ProyectorCalendario** (contexto `obligaciones`, nuevo caso de uso)

- Entrada: `(estudioPrincipal, clienteId, periodoFiscal)`.
- Proceso: lee `PerfilFiscal` del cliente, itera inscripciones activas, busca `CatalogoObligacion` aplicables, resuelve `ReglaVencimiento` vigente, aplica ajuste día hábil, hace upsert idempotente de `Vencimiento`.
- Salida: emite `obligaciones.calendario-mensual-listo`.
- Variante `ProyectarCalendarioMasivo` corre en batch mensual para todos los clientes del estudio.

**B. CatálogoReglas versionado** (contexto `obligaciones`, extiende el modelo actual)

- Nueva entidad `CatalogoObligacion` (catálogo administrable, con nombre, jurisdicción, frecuencia, activo).
- Extensión de `ReglaVencimientoEntity` con `jurisdiccion`, `regimen`, `vigenciaDesde`, `vigenciaHasta`, `origen` (MANUAL | SCRAPING_OFICIAL | IMPORTACION), `estado` (PROPUESTA | ACTIVA | RECHAZADA).
- Invariante dura: no puede haber dos reglas activas para el mismo `(tipo, jurisdicción, régimen, terminación)` con vigencias solapadas.
- Servicio de dominio `ReglaVencimientoService.calcularFecha(perfil, tipoObligacion, periodo) → FechaHabil` que reemplaza al actual.

**C. PerfilFiscal del cliente** (contexto `clientes`, extensión del aggregate)

- Nuevo value object `PerfilFiscal` con `cuit`, `inscripciones: InscripcionJurisdiccion[]`, `responsableDefault`, `overridesResponsable`.
- `InscripcionJurisdiccion` con `jurisdiccion`, `regimen`, `numeroInscripcion?`, `activa`, `desde`, `hasta?`.
- Comandos nuevos: `actualizarPerfilFiscal`, `inscribirEnJurisdiccion`, `darDeBajaInscripcion`, `asignarResponsableDefault`, `asignarResponsablePorObligacion`.
- Evento público: `clientes.perfil-fiscal-actualizado` que dispara re-proyección.

**D. CalendarioDíasHábiles** (contexto nuevo `calendario` o dentro de `shared`)

- Entidad `DiaFeriado` con `fecha`, `tipo` (NACIONAL | BANCARIO | PROVINCIAL | MUNICIPAL), `jurisdiccionAfectada`.
- Repositorio `FeriadoRepository.esHabil(fecha, jurisdiccion)` + `siguienteHabil(fecha, jurisdiccion)`.
- Fuentes: `argentinadatos.com` (nacionales), scraping BCRA anual (bancarios), carga manual (provinciales).
- Scope global (igual que las reglas).

**E. CalendarioScraperPort + adapters** (contexto `integraciones`, nuevo port)

- Distinto del `FiscalScraperPort` existente — ese scrape el DFE con credenciales del cliente.
- `CalendarioScraperPort.obtenerReglasPropuestas(fuente, rangoFechas)` — salida de reglas candidatas.
- Implementaciones: `ScraperCalendarioARCA` (sobre `seti.afip.gob.ar/av/`), `ScraperCalendarioARBA`, `ScraperCalendarioAGIP`, `ScraperFeriadosBCRA`.
- Infra: ECS Fargate tasks con Playwright headless, disparados por EventBridge Scheduler. Reuse de la infra declarada en el scaffolding actual de `integraciones`. Resultado en SQS para procesamiento asíncrono por el backend NestJS.

**F. ConfiguraciónIngesta + EjecuciónIngesta** (contexto `integraciones`, nuevas entidades)

- `ConfiguracionIngestaCatalogo` (scope global): `fuente`, `habilitado`, `cadenciaDias`, `próximaEjecución`, `última*`.
- Defaults: 7 días para ARCA/ARBA/AGIP, 30 días para BCRA feriados.
- `EjecucionIngesta`: audit trail (`inicio`, `fin`, `estado`, `reglasNuevas`, `reglasModificadas`, `errores[]`, `disparador` MANUAL | SCHEDULE, `disparadoPor`).
- Backend llama a EventBridge `PutRule` para sincronizar cadencia cuando el superadmin la edita.
- Endpoint `POST /admin/ingesta/:fuente/ejecutar-ahora` para disparo on-demand.
- Flujo de aprobación: scraper produce reglas en estado PROPUESTA, superadmin las revisa con diff y aprueba/rechaza.

**G. ProgramadorRecordatorios + EnviadorCalendarioMensual** (contexto `notificaciones`)

- Listener de `obligaciones.vencimiento-proyectado` → programa alertas individuales según `AlertaConfig` del cliente.
- Listener de `obligaciones.calendario-mensual-listo` → genera PDF consolidado y dispara email + item en portal del cliente.
- Reusa `Notificacion` existente con `TipoNotificacion.VENCIMIENTO_PROXIMO`.
- Canales: email (SMTP/SES), portal feed (ya existente).
- Config por cliente: días de anticipación del recordatorio (default 3).

**H. Feed de vencimientos del cliente** (contexto `portal`, extiende las queries)

- Nuevas queries: `obtenerVencimientosProximosCliente(clientePrincipal)`, `obtenerHistoricoVencimientos(clientePrincipal, filtros)`, `descargarCalendarioMensualPDF(clientePrincipal, periodo)`.
- Read-model context, compone public-views de `obligaciones` sin tocar sus schemas.
- Vista dedicada para el usuario final (cliente del estudio), no para el staff.

### Decisiones arquitectónicas

- **Multi-tenant vs global**: `Vencimiento` y `PerfilFiscal` son tenant-scoped (`EstudioPrincipal`). `CatalogoObligacion`, `ReglaVencimiento`, `DiaFeriado`, `ConfiguracionIngestaCatalogo` son **globales** (`GlobalRepository`) porque el calendario oficial es común a todos los estudios.
- **Make, no buy**: sin dependencia de AFIP SDK ni de Errepar/Thomson Reuters. Scraping propio.
- **Scraping en Fargate, no Lambda**: alineado con el scaffolding existente de `FiscalScraperPort`. Playwright + chromium pesan demasiado para Lambda; Fargate da timeouts largos y recursos estables.
- **Reglas scrapeadas en estado PROPUESTA**: protege el calendario productivo de un cambio de HTML mal parseado. Requiere aprobación de superadmin.
- **Idempotencia** del proyector: clave única `(cliente × tipo × periodo)` en `Vencimiento`; `ingestaId` único por ejecución.
- **Scope de fases**: MVP arranca con ARCA (IVA mensual + SICOSS) para demostrar tracer bullet end-to-end; luego se expande a ARBA, AGIP, y a más tipos de obligación.
- **Eventos de dominio nuevos**: `vencimiento-proyectado`, `calendario-mensual-listo`, `vencimiento-prorrogado`. Catalogados en CLAUDE.md cuando se implementen.
- **Tenant boundary**: el architecture test valida que todos los handlers de `obligaciones` reciban `EstudioPrincipal`. Se mantiene.

### Schema / persistencia

- Migración: extender `regla_vencimiento` con columnas de jurisdicción, régimen y vigencia.
- Nuevas tablas: `catalogo_obligacion`, `perfil_fiscal` (o embebido en `cliente` como JSONB), `inscripcion_jurisdiccion`, `dia_feriado`, `configuracion_ingesta_catalogo`, `ejecucion_ingesta`, `regla_vencimiento_propuesta` (buffer antes de aprobación).
- Extensión de `vencimiento` con `responsable_id`, `fecha_nominal`, `fecha_ajustada`, `origen_regla_id`.
- Indices: claves naturales sobre `(cliente × tipo × periodo)` para idempotencia del proyector.

### API contracts (a nivel conceptual)

- `POST /obligaciones/calendario/proyectar` — dispara proyección de un cliente/período.
- `PATCH /obligaciones/vencimientos/:id/presentar` — existe, sin cambios.
- `PATCH /obligaciones/vencimientos/:id/prorrogar` — nuevo.
- `PATCH /obligaciones/vencimientos/:id/no-aplica` — nuevo.
- `GET /portal/mis-vencimientos` — para el cliente final.
- `GET /portal/mi-calendario/:periodo.pdf` — descarga PDF.
- `GET /admin/ingesta/configuraciones` y `POST /admin/ingesta/:fuente/ejecutar-ahora` — superadmin.
- `GET /admin/reglas/propuestas` + `PATCH /admin/reglas/propuestas/:id/aprobar|rechazar` — superadmin.

### Infraestructura AWS

- Fargate task definition por scraper (ARCA, ARBA, AGIP, BCRA).
- EventBridge Scheduler con reglas generadas desde `ConfiguracionIngestaCatalogo`.
- SQS para el resultado asíncrono del scraping (el backend consume el queue y procesa reglas).
- CloudWatch alarms por N fallos consecutivos de un scraper, ruteadas a SNS → email al superadmin.
- Secrets Manager: ya previsto en el scaffolding existente para credenciales (no aplica al scraping público pero queda el pattern).
- Terraform en `infra/` para todo lo anterior.

## Testing Decisions

### Filosofía

Tests sobre comportamiento externo, no implementación. Cada módulo deep se testea via su interfaz pública con casos reales del dominio fiscal argentino.

### Cobertura solicitada: todos los módulos (A-H)

**A. ProyectorCalendario**

- Tests unitarios del caso de uso con `PerfilFiscal` mockeado y fixture de reglas vigentes.
- Casos: cliente RI con inscripción única en ARCA; cliente con inscripción múltiple (ARCA + ARBA Conv Mult); cliente cuyo perfil cambió a mitad de período; re-proyección idempotente.
- Prior art: `obligaciones/application/commands/crear-vencimiento.command.spec.ts`.

**B. CatálogoReglas versionado**

- Tests del servicio de dominio `ReglaVencimientoService.calcularFecha` con matriz `(tipo × jurisdicción × régimen × terminación)`.
- Casos: regla vigente a la fecha de resolución; regla con vigencia pasada (histórica, no aplica); colisión de vigencias rechazada; fallback cuando no hay regla.
- Prior art: `obligaciones/domain/services/regla-vencimiento.service.spec.ts`.

**C. PerfilFiscal del cliente**

- Tests del value object y los comandos de aggregate.
- Casos: alta con N inscripciones; baja lógica respetando histórico; override de responsable por tipo; evento `perfil-fiscal-actualizado` emitido correctamente.
- Prior art: specs de `clientes/domain/entities/cliente.entity.ts`.

**D. CalendarioDíasHábiles**

- Tests del repositorio con fixture de feriados.
- Casos: fecha hábil; feriado nacional corre al siguiente; feriado bancario que NO es nacional corre; feriado provincial afecta solo a su jurisdicción; fin de semana.

**E. Scrapers del calendario oficial**

- Integration tests contra fixtures HTML congelados (snapshots de `seti.afip.gob.ar/av/`, `web.arba.gov.ar`, AGIP).
- Casos: parseo correcto de la tabla; cambio menor en el HTML que no rompe; cambio mayor que genera error controlado; rate-limit respetado.
- Prior art: adapters en `integraciones/infrastructure/` existentes.

**F. ConfiguraciónIngesta + EjecuciónIngesta**

- Tests unitarios del flujo de aprobación.
- Casos: PROPUESTA → ACTIVA respetando vigencias solapadas; PROPUESTA → RECHAZADA; disparo manual crea `EjecucionIngesta` con `disparador=MANUAL`; cambio de cadencia genera llamada al adapter de EventBridge (mockeado).

**G. ProgramadorRecordatorios + EnviadorCalendarioMensual**

- Tests unitarios de los listeners con bus en memoria.
- Casos: evento `vencimiento-proyectado` programa N recordatorios; evento `calendario-mensual-listo` dispara email + portal; `AlertaConfig` respetada por cliente.
- Prior art: `administracion/application/listeners/dashboard-stats.listener.ts`.

**H. Feed del portal del cliente**

- Tests de las queries y del public-view composition.
- Casos: cliente ve solo sus propios vencimientos (nunca los de otros clientes ni de otros estudios); orden por fecha; filtro por estado.
- Prior art: queries existentes en `portal/application/queries/`.

### Arquitectura

- `architecture.spec.ts` debe seguir pasando: tenant boundary sobre `obligaciones` y `clientes`; read-model rules sobre `portal`; `CatalogoObligacion`, `ReglaVencimiento`, `DiaFeriado` y `ConfiguracionIngestaCatalogo` deben usar `GlobalRepository`.

### TDD obligatorio

- Feature sigue el flujo `/tdd` del proyecto: tests primero, código después, para cada uno de los módulos A-H.

## Out of Scope

- **Integración WSCCOMU / DFE de ARCA** — se difiere a una fase 3 posterior. El PRD actual no contempla consumir notificaciones del buzón fiscal del cliente.
- **Padrón ARCA** (`ws_sr_constancia_inscripcion`) — se difiere. El perfil fiscal del cliente se carga manualmente por ahora.
- **Delegación AFIP de WS al CUIT del estudio** — fuera de scope hasta fase 2/3.
- **Tasas municipales** (24 municipios de PBA y otros) — diferidas.
- **SIFERE / Comisión Arbitral** integración directa — diferida.
- **Liquidación de recibos de sueldos** — pertenece al contexto `nomina`, no a vencimientos.
- **Facturación del estudio a sus clientes** — pertenece al contexto `facturacion`.
- **Integración con Errepar/Thomson Reuters ONVIO** — make-not-buy: se descarta.
- **AFIP SDK como dependencia** — descartado por el socio.
- **Balance PDF como "vencimiento"** — aunque aparece en el Excel histórico, pertenece más a `documentos`. Se revisa en un ticket aparte.
- **Multi-idioma** — producto es es-AR.
- **Webhook de prórroga recibido desde ARCA** — no existe tal WS; la prórroga llega vía scraping o carga manual.

## Further Notes

### Fuentes de referencia

- `_docs/vencimientos-viabilidad-tecnica.md` — investigación previa de APIs oficiales, intermediarios comerciales, y limitaciones técnicas.
- `_docs/vencimientos-domain-model.md` — modelo de dominio detallado previo al PRD.
- `_docs/Proyecto aplicación estudio contable.docx` — requerimiento original del socio.
- `_docs/Vtos mensuales por responsable.xlsx` — planilla real del estudio, input para el catálogo inicial de tipos de obligación.

### Secuencia de tracer bullets sugerida (PRD → implementación)

El PRD es el qué. La implementación la rompemos en slices finos, cada uno end-to-end. Orden propuesto:

1. **Tracer 1**: un cliente con perfil mínimo (CUIT + una inscripción ARCA RI) + una regla ARCA (IVA mensual) + proyección → vencimiento creado → email al cliente con una línea. Prueba la cadena completa sin infraestructura de scraping.
2. **Tracer 2**: perfil fiscal múltiple, ajuste día hábil con feriados nacionales, recordatorios configurables.
3. **Tracer 3**: scraping ARCA en Fargate + flujo de aprobación superadmin.
4. **Tracer 4**: planilla por responsable + marcación de presentado/prorrogado/no-aplica.
5. **Tracer 5**: ARBA + AGIP + feriados BCRA.
6. **Tracer 6**: import masivo desde Excel histórico + proyección retroactiva.

### Decisiones confirmadas por el socio (sesión 2026-04-20)

1. Notificación al cliente: **híbrida** (PDF mensual + recordatorios individuales).
2. Responsable: **default por cliente + override por obligación**.
3. Régimen fiscal: **múltiples inscripciones paralelas**.
4. Cadencia scraping default: **7d ARCA/ARBA/AGIP, 30d feriados**.
5. Aprobación de reglas scrapeadas: **superadmin SaaS**.
6. Prórrogas: **scraping + sugerencia**, el responsable aprueba.
7. Feriados bancarios: **scraping BCRA anual + corrección manual**.
8. Rol superadmin: **ya existe en iam** (`ROL.SUPERADMIN` con `AdminGuard`).

### Riesgos técnicos identificados

- **Fragilidad del scraping**: un cambio en el HTML oficial puede romper la ingesta. Mitigación: estado PROPUESTA + aprobación humana + alarma por fallos consecutivos.
- **Feriado bancario desactualizado**: BCRA publica el calendario anual tarde. Mitigación: carga manual como override.
- **Cliente sin perfil fiscal completo**: genera vencimientos faltantes o spurios. Mitigación: bloqueo duro — no se proyecta si no hay perfil, y se muestra alerta al socio.
- **Cambio de perfil a mitad de mes**: los vencimientos ya proyectados pueden quedar inválidos. Mitigación: re-proyección automática para vencimientos futuros pendientes, preservando los pasados.
