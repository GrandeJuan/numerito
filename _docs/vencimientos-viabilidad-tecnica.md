# Vencimientos — Viabilidad técnica

Research previo al PRD. Qué podemos automatizar hoy, qué depende de fuentes oficiales, qué es trabajo manual inevitable.

Fecha: 2026-04-20

---

## 1. Alcance real (según `_docs/`)

### Tipos de vencimiento que el estudio sigue hoy (Excel por responsable)

**Nacionales (ARCA, ex-AFIP):**

- SICOSS / F931 (aportes seg. social)
- IVA mensual (DJ + pago)
- Régimen Informativo Compras y Ventas
- CITI Compras
- Libro IVA Digital
- IVA Diferido
- Anticipo Ganancias (sociedades y PH)
- DJ Ganancias anual
- Bienes Personales / Acciones y Participaciones
- Operaciones Internacionales
- SICORE (ret. Ganancias)
- Ret. SIJP
- Ret. SIRE

**Provinciales (ARBA — PBA):**

- Retenciones / Percepciones IIBB PBA
- IIBB Convenio Multilateral con PBA
- IIBB Local PBA

**CABA (AGIP + ARCIBA):**

- ARCIBA (agentes de retención CABA)
- IIBB CABA Local
- IIBB AGIP Anual
- Régimen Simplificado IIBB

**Otras jurisdicciones:**

- IIBB por Convenio Multilateral (CM03/CM05 → SIFERE)
- Tasas municipales (ej. Seg. e Higiene)

**Eventos societarios / anuales:**

- Presentación Balance PDF
- Participaciones societarias

### Variables que determinan la fecha concreta

1. **Terminación CUIT** (0-9) — la mayoría de los impuestos nacionales se escalonan por este eje.
2. **Régimen del contribuyente** — RI / Monotributo / Agente de retención; cambia toda la grilla.
3. **Jurisdicciones inscriptas** — determina si aplica ARBA, AGIP, Conv Mult, municipios.
4. **Tipo de impuesto/obligación**.
5. **Período fiscal** (mes/año).
6. **Día hábil** — si cae feriado nacional/bancario/provincial se corre al siguiente hábil.

---

## 2. Fuentes oficiales y APIs disponibles

### 2.1 ARCA (ex-AFIP)

| Servicio                           | Protocolo          | Propósito                                                                               | Costo  | Notas                                                                                                               |
| ---------------------------------- | ------------------ | --------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| **WSAA**                           | SOAP/HTTPS + X.509 | Autenticación, emite Token + Sign (TA vigencia 12h)                                     | Gratis | Obligatorio para cualquier WS. Requiere certificado X.509 emitido por ARCA.                                         |
| **ws_sr_constancia_inscripcion**   | SOAP               | Padrón contribuyente: condición IVA, actividades CAES, domicilio, categoría Monotributo | Gratis | Reemplaza el viejo `ws_sr_padron_a5`. Métodos `getPersona_v2` y `getPersonaList_v2` (hasta 250 CUITs).              |
| **WSCCOMU**                        | SOAP + MTOM        | Consumir comunicaciones del Domicilio Fiscal Electrónico                                | Gratis | Documento vigente desde 2016. ARCA actualiza diariamente ~6AM. Descarga adjuntos binarios (PDF).                    |
| **TRABAJO_F931**                   | SOAP               | Consulta DDJJ seg. social por CUIT-período                                              | Gratis | Útil para conciliar.                                                                                                |
| **Agenda oficial de Vencimientos** | Web form           | `seti.afip.gob.ar/av/seleccionVencimientos.do`                                          | Gratis | **No hay API ni export estructurado.** Filtros por fecha, terminación CUIT e impuesto. Scraping viable pero frágil. |

**Delegación (crítico):** cada CUIT cliente debe delegar los servicios al CUIT del estudio via "Administrador de Relaciones". No es automático — lo acepta el cliente con su clave fiscal una sola vez por servicio.

### 2.2 ARBA (Provincia de Buenos Aires)

- **DFE ARBA** (`dfe.arba.gov.ar`) — HTTPS + XML firmado con MD5, **no SOAP**. Auth con user/password. Permite consultar alícuotas de ret/per y padrón.
- **Calendario de vencimientos** publicado en `web.arba.gov.ar/vencimientos-contribuyentes-convenio` (HTML) y en **formato ICS descargable** para agendas electrónicas — no es una API pero es parseable.

### 2.3 AGIP (CABA)

- **ISIBWS** — SOAP, consulta padrón IIBB CABA.
- **Consulta de deuda ISIB** — SOAP.
- **Portal** `lb.agip.gob.ar/ws/servicios.html` con docs.
- **Calendario**: publicado en HTML, sin API.

### 2.4 Comisión Arbitral (Convenio Multilateral)

- **SIFERE Web Consultas** (`www.sifereweb.gob.ar`) — portal interactivo con auth por clave fiscal AFIP. Sin API pública.
- **Portal Federal Tributario** (`pft.comarb.gob.ar`) — consulta unificada. Sin API pública.
- **Calendario CM**: publicado por la CA cada año.

### 2.5 Datos auxiliares gratuitos

| Dato                  | Fuente                                                | API                         |
| --------------------- | ----------------------------------------------------- | --------------------------- |
| Feriados nacionales   | `argentinadatos.com`, `nolaborables.com.ar` (pjnovas) | REST JSON gratis, ilimitada |
| Feriados bancarios    | BCRA publica PDF anual                                | Manual                      |
| Feriados provinciales | Banco Provincia publica JSON                          | REST                        |

### 2.6 Intermediarios comerciales

**AFIP SDK** (`afipsdk.com`) — wrapper REST sobre los WS de ARCA + automatizaciones (DFE, delegación, factura electrónica).

- Free: 1 CUIT, 1k req/mes.
- Pro: USD 25/mes, 10 CUITs, 10k req.
- Growth: USD 80/mes, 100 CUITs, 100k req.
- Startup: USD 250/mes, 1000 CUITs, 1M req.
- Tier separado para automatizaciones (100 → 100k, hasta USD 1500/mes).
- Nos ahorra WSAA + firma PKCS#7 + manejo MTOM + PDFs base64.

**Competidores verticales** (ONVIO de Thomson Reuters, Errepar Mi Estudio, SOS Contador, Xubio): no exponen APIs públicas; son el producto competidor directo.

---

## 3. Limitaciones y riesgos técnicos

### 3.1 El calendario de vencimientos **no existe como dataset abierto**

- ARCA, ARBA, AGIP, CA y municipios publican cada año via Resolución General.
- No hay feed JSON/ICS unificado. El único export estructurado es el ICS de ARBA.
- Implicancia: **hay que modelar internamente** el calendario con un motor de reglas `(impuesto × régimen × terminación_cuit × jurisdicción × período) → fecha_vencimiento`, y cargarlo manualmente o vía scraping.
- Ventana de actualización: anual (RG fin de año). Algunas obligaciones tienen modificaciones intra-año (prórrogas, feriados).

### 3.2 Integración con ARCA es SOAP legacy

- Toda la stack oficial es SOAP 1.2 + XML + firma PKCS#7 con X.509.
- En Node.js/NestJS: libs `strong-soap` / `soap` + `node-forge` / `pkijs` para firma. Funcional pero verboso.
- TA (ticket de acceso) dura 12h, hay que cachear y renovar por CUIT/servicio.
- Alternativa: **AFIP SDK** tapa toda esta complejidad a cambio de costo recurrente + dependencia de tercero.

### 3.3 Delegación multi-tenant es fricción real

- Cada estudio opera cientos de CUITs.
- Cada cliente tiene que delegar cada servicio WS al CUIT del estudio una sola vez, desde su propia clave fiscal.
- En el onboarding necesitamos un flujo guiado (pdf/video) para el cliente + verificación de que la delegación efectivamente se concretó (no hay WS para listar delegaciones entrantes; hay que probar el servicio).

### 3.4 DFE requiere polling diario, no push

- ARCA no notifica por webhook. El cliente debe hacer polling (pueden usar el email de aviso como trigger aproximado).
- WSCCOMU devuelve mensajes publicados + adjuntos base64.
- Las notificaciones se consideran leídas automáticamente a los 5 días hábiles aunque no se abran — el SLA operativo del estudio debe ser agresivo.

### 3.5 Ajuste día hábil por jurisdicción

- Vencimiento nacional cae en feriado nacional → se corre.
- Vencimiento bancario cae en feriado bancario (puede diferir del nacional) → se corre.
- Vencimiento provincial cae en feriado provincial → se corre.
- La lógica no es trivial: hay que cruzar 3-4 calendarios de feriados.

### 3.6 Condición del contribuyente es mutable

- Un cliente puede pasar de Monotributo a RI, cambiar jurisdicciones, categorías. Su grilla cambia.
- Necesitamos re-evaluar periódicamente via padrón (`ws_sr_constancia_inscripcion`) o detectar el cambio manualmente.

### 3.7 Volumen de escritura cero desde el calendario

- El módulo Vencimientos es **read-heavy**: genera eventos proyectados, no modifica fuentes externas.
- Encaja bien como **read-model context** dentro de la arquitectura existente (cruza Clientes + Obligaciones + Integraciones).

---

## 4. Matriz de viabilidad por feature del PRD latente

| Feature                                                           | Viabilidad     | Dependencia                                      | Complejidad                                                  |
| ----------------------------------------------------------------- | -------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| Calendario manual de vencimientos por cliente                     | **Alta**       | Ninguna                                          | Baja. Motor de reglas interno + cron.                        |
| Envío mensual automatizado de vencimientos al cliente (email/PDF) | **Alta**       | SMTP + generador de PDF                          | Baja.                                                        |
| Planilla de vencimientos por responsable                          | **Alta**       | Base de datos propia                             | Baja.                                                        |
| Autocompletar datos del contribuyente desde padrón ARCA           | **Media**      | WSAA + constancia inscripción + delegación       | Media. SOAP + X.509.                                         |
| Consolidar notificaciones del DFE dentro del ERP                  | **Media-Baja** | WSCCOMU + delegación + polling diario            | Alta. MTOM + adjuntos + re-intentos. AFIP SDK lo simplifica. |
| Alerta automática de vencimiento próximo                          | **Alta**       | Calendario interno + feriados API                | Baja.                                                        |
| Detectar cambio de condición fiscal (Mono↔RI)                     | **Media**      | Padrón periódico                                 | Media.                                                       |
| Importar planilla histórica desde Excel existente                 | **Alta**       | Parser XLSX                                      | Baja.                                                        |
| Integración con ARBA/AGIP/SIFERE                                  | **Baja**       | Cada organismo tiene stack distinta              | Alta, por organismo. Postergar.                              |
| Sincronizar calendario oficial ARCA → BD                          | **Baja**       | Scraping de `seti.afip.gob.ar/av` o carga manual | Media. Frágil. Carga manual inicial es aceptable.            |

---

## 5. Recomendación de camino técnico

### Fase 1 — MVP sin integraciones (2-3 sprints)

- Modelo interno `Vencimiento` en contexto `Obligaciones` (ya existe) con reglas `(tipo × terminación × régimen × jurisdicción × período)`.
- Carga manual del calendario ARCA/ARBA/AGIP 2026 — planilla semilla aprobada por el socio.
- Ingesta feriados vía `argentinadatos.com` (gratis, ilimitada) para ajuste día hábil.
- Motor de proyección que explota reglas contra cada cliente y genera `VencimientoProyectado` persistente.
- Planilla por responsable + envío mensual al cliente (PDF/email).
- Import del Excel histórico como backfill.

**Por qué arrancar así:** el 90% del valor del módulo está acá. No depende de delegaciones AFIP ni de certificados. Tracer bullet end-to-end.

### Fase 2 — Enriquecimiento con padrón ARCA (2 sprints)

- WSAA + `ws_sr_constancia_inscripcion` para autocompletar alta de cliente y re-verificar trimestral.
- Evaluar AFIP SDK vs implementación propia: con ~200 CUITs por estudio tier Growth (USD 80/mes) es muy competitivo contra semanas de desarrollo.

### Fase 3 — DFE integrado (2-3 sprints)

- WSCCOMU polling diario por CUIT delegado.
- UI unificada de comunicaciones dentro del ERP.
- Flujo guiado de delegación en onboarding.

### Fase 4 — Integraciones provinciales (opcional)

- ARBA DFE, AGIP ISIBWS, SIFERE — caso por caso cuando haya demanda concreta.

---

## 6. Preguntas abiertas para el socio

1. **¿Cuál es la prioridad real?** ¿Consolidar la planilla interna (MVP fase 1) o reemplazar el email como canal con el cliente? Las dos son valiosas pero ordenan sprints distinto.
2. **¿Cuántos CUITs gestiona el estudio?** Determina si AFIP SDK conviene (<100 → Growth; >1000 → Startup o implementación propia).
3. **¿Aceptan carga manual del calendario oficial los primeros años?** Alternativa es scraping frágil; tercera alternativa es suscripción a Errepar/TR para datos, que son competidores.
4. **¿Los clientes del estudio ya tienen delegados WS al CUIT del estudio?** Si no, la fase 2/3 depende de un onboarding explícito que hoy no existe.
5. **¿Queremos modelar tasas municipales (24 municipios distintos en PBA)?** Esfuerzo grande, payoff variable por cliente.
6. **¿El equipo acepta depender de AFIP SDK (USD 25-250/mes) para no implementar WSAA+WSCCOMU?** Decisión make-vs-buy temprana.

---

## 7. Fuentes

### Oficiales

- [Vencimientos | ARCA](https://www.afip.gob.ar/vencimientos/)
- [Agenda de Vencimientos (ARCA)](https://seti.afip.gob.ar/av/seleccionVencimientos.do)
- [WSAA — Especificación Técnica](https://www.afip.gob.ar/ws/wsaa/especificacion_tecnica_wsaa_1.2.2.pdf)
- [Catálogo WS de negocio | ARCA](https://www.afip.gob.ar/ws/documentacion/catalogo.asp)
- [Manual ws_sr_constancia_inscripcion](https://www.afip.gob.ar/ws/WSCI/manual_ws_sr_ws_constancia_inscripcion_v3.7.pdf)
- [WSCCOMU — Consumir Comunicaciones Ventanilla Electrónica](https://www.afip.gob.ar/ws/WSCComu/vecuwsconcomunicaciones.pdf)
- [Domicilio Fiscal Electrónico | ARCA](https://www.afip.gob.ar/domiciliofiscalelectronico/)
- [Vencimientos Convenio Multilateral | ARBA](https://web.arba.gov.ar/vencimientos-contribuyentes-convenio)
- [Web Services | AGIP](https://lb.agip.gob.ar/ws/servicios.html)
- [SIFERE | Comisión Arbitral](https://www.ca.gob.ar/sifere)

### Comerciales / terceros

- [AFIP SDK — pricing](https://afipsdk.com/pricing/)
- [AFIP SDK — DFE Node.js](https://afipsdk.com/docs/automations/domicilio-fiscal-electronico/nodejs/)
- [PyAfipWs (open source reference)](https://github.com/reingart/pyafipws)
- [Calendario Fiscal Argentina (no oficial)](https://www.calendariofiscal.com.ar/)
- [ONVIO | Thomson Reuters](https://www.thomsonreuters.com.ar/es/soluciones-fiscales-contables-gestion/soluciones-contables-y-de-informacion/software-contable-onvio.html)

### Feriados / día hábil

- [ArgentinaDatos API](https://argentinadatos.com/docs/operations/get-feriados.html)
- [nolaborables (github)](https://github.com/pjnovas/nolaborables)
- [BCRA — feriados nacionales 2026](https://www.bcra.gob.ar/en/consult-national-holiday-2026/)
