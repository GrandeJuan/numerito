# Scraper Ingesta — Troubleshooting

## Architecture Overview

The ingesta pipeline scrapes official fiscal sites (ARCA, ARBA, AGIP, BCRA) and produces
`ReglaVencimiento` proposals for superadmin review.

```
EventBridge Scheduler (rate: cadenciaDias)   ──or──   Superadmin clicks "Ejecutar"
    │                                                        │
    ▼                                                        ▼
ECS Fargate Task (AWS)                        Docker container (local)
    │  Playwright + Chromium                      │  same image: numerito-scraper:latest
    │  scrapes official site per FUENTE            │
    ▼                                              ▼
POST /api/v1/admin/ingesta/{FUENTE}/resultado
    │  authenticated via x-ingesta-secret or admin JWT
    ▼
ProcesarResultadoScrapingHandler
    │  diff against active rules
    ▼
ReglaVencimiento (estado: PROPUESTA)
    ▼
Superadmin approves/rejects in /admin/reglas-propuestas
```

**Supported fuentes:** `ARCA`, `ARBA`, `AGIP`, `BCRA_FERIADOS`

**Adapter selection (automatic):**
- If `ECS_CLUSTER_ARN` + `SCRAPER_TASK_DEFINITION_ARNS` + subnets + SGs are set → `AwsFargateTaskLauncher` (prod)
- Else if `SCRAPER_IMAGE` + `SCRAPER_BACKEND_URL` + `INGESTA_SECRET` are set → `DockerTaskLauncher` (local)
- Else → no launcher; "Ejecutar" returns an explanatory error

## How to Run Locally

One command from the repo root:

```bash
cp .env.example .env   # first time only — review and adjust values
docker compose up --build
```

This builds all services including the `scraper-image` (tagged `numerito-scraper:latest`),
then starts backend, frontend, and Postgres. The `scraper-image` service runs `true` and exits
immediately — it only exists to ensure the Docker image is built before the backend starts
(`depends_on` with `condition: service_completed_successfully`).

Once the stack is up, open `/admin/integraciones` and click "Ejecutar" for any fuente.
The backend spawns a Docker container via `DockerTaskLauncher`, the scraper hits the live
official site, POSTs the result to the webhook, and rows appear in `ejecucion_ingesta` +
`regla_vencimiento`.

**After changing scraper code**, `docker compose up --build` rebuilds the image automatically.

### Smoke test (optional, no CI)

Run all 4 scrapers against live sites without persisting anything:

```bash
pnpm smoke:scrapers
```

Prints a summary table with regla/feriado counts per fuente. A `0 reglas` result for
non-feriado fuentes is a WARNING — likely means the upstream HTML changed.

## How to Read Logs

### Docker (local)

Logs are available via the UI: Admin → Ingesta → Ejecuciones → click a row → "Ver logs".

Under the hood, `DockerTaskLauncher.getLogs()` calls `container.logs()` with `tail: 500`.
If the container was already pruned, the UI shows a message that logs were discarded.

You can also check Docker directly:

```bash
# List scraper containers (running and exited)
docker ps -a --filter "label=numerito.kind=scraper"

# Tail logs of a specific container
docker logs <container-id> --tail 200
```

### CloudWatch (AWS)

`AwsFargateTaskLauncher.getLogs()` queries CloudWatch Logs using `GetLogEventsCommand`
(last 500 events, most recent first).

**Log group:** configured via `SCRAPER_LOG_GROUP` env var (e.g., `/ecs/numerito-prod-scraper`).

**Log stream naming convention (ECS awslogs):**
```
{lowercase-fuente}/scraper/{task-id}
```
Examples:
- `arca/scraper/abc123def456`
- `arba/scraper/abc123def456`
- `bcra_feriados/scraper/abc123def456`

The task ID is extracted from the full ECS task ARN automatically.

**CLI quick check:**
```bash
# Tail recent logs for a specific fuente
aws logs tail /ecs/numerito-prod-scraper \
  --filter-pattern "arca" --since 1h

# Get logs for a specific task
aws logs get-log-events \
  --log-group-name /ecs/numerito-prod-scraper \
  --log-stream-name "arca/scraper/<task-id>" \
  --limit 100
```

**Graceful fallbacks in the UI:**
- Stream not found yet → "El task aún no generó logs" (task may still be starting)
- Empty events → "El task puede estar arrancando"
- `SCRAPER_LOG_GROUP` not configured → hint message about the missing env var

## Common Issues

### 1. Backend no encuentra imagen `numerito-scraper:latest`

**Symptom:** Clicking "Ejecutar" returns an error like:
> La imagen "numerito-scraper:latest" no existe en el daemon Docker. Ejecuta "docker compose build scraper-image" para construirla.

**Cause:** The scraper Docker image wasn't built. This happens if you ran `docker compose up` without `--build`, or if you pruned images.

**Fix:**
```bash
docker compose build scraper-image
```
Or restart with `docker compose up --build` to rebuild everything.

### 2. Scraper produces 0 reglas but no errors

**Symptom:** EjecucionIngesta shows EXITOSA with reglasNuevas=0, reglasModificadas=0.

**Likely cause:** The upstream official site changed its HTML structure. Each fuente has its own parser with CSS selectors that may break on DOM changes.

**Diagnosis:**
1. Check logs (see "How to Read Logs" above) for "Conceptos no reconocidos" or similar warnings
2. Run the smoke test: `pnpm smoke:scrapers` — a `0 reglas` WARNING confirms the parser is broken
3. If no tables found → the site changed their DOM

**Fix:**
1. Download current page HTML manually or check the scraper's raw output in logs
2. Compare against the committed fixture in `apps/backend/src/integraciones/infrastructure/adapters/__fixtures__/`
3. Update CSS selectors in the relevant parser (`arca-html-parser.ts`, `arba-html-parser.ts`, `agip-html-parser.ts`, or `bcra-feriados-parser.ts`)
4. Add a new fixture, update tests
5. Rebuild the Docker image: `docker compose build scraper-image`

### 3. Fargate task fails to start (AWS)

**Symptom:** CloudWatch alarm fires. No logs in log group.

**Likely causes:**
- **ECR image pull failure:** Check IAM role `numerito-prod-scraper-execution` has ECR pull permissions
- **Subnet/SG misconfiguration:** Task needs outbound HTTPS (443) to both the official site and the backend URL
- **Insufficient capacity:** Rare with Fargate, but possible. Check ECS service events

**Diagnosis:**
```bash
aws ecs describe-tasks --cluster numerito-prod --tasks <task-arn>
# Check "stoppedReason" and "containers[].reason"
```

### 4. Fargate task runs but backend rejects the POST

**Symptom:** Logs show `Backend rejected resultado: HTTP 401` or `HTTP 403`.

**Likely cause:** `INGESTA_SECRET` mismatch between the scraper container and the backend.

**Fix:**
1. Verify the secret value matches on both sides (Secrets Manager for AWS, `.env` for local)
2. Check that the task definition references the correct secret ARN
3. Redeploy the task definition after updating the secret

### 5. PROPUESTA rules have wrong diaVencimiento

**Symptom:** Superadmin sees propuestas with dates that don't match the official page.

**Likely cause:** The parser matched the wrong row, or the site changed its column order.

**Diagnosis:**
1. Check the parser's concept mapping (e.g., `CONCEPTO_MAP` in `arca-html-parser.ts`)
2. Download and inspect the live HTML
3. Compare the fixture parse output vs live parse output using unit tests

### 6. Task runs but takes > 5 minutes

**Symptom:** Task completes but logs show long execution time.

**Likely cause:** `MESES_ADELANTE` is set too high, or the official site is slow to respond.

**Mitigation:**
- Default `MESES_ADELANTE=0` (current month only) is sufficient for most cases
- The task launches a fresh Playwright browser per invocation
- Consider increasing Fargate task timeout in the task definition if needed

### 7. CloudWatch alarm false positive (AWS)

**Symptom:** Alarm fires but the scraper actually succeeded.

**Diagnosis:** The metric filter matches on `"Fatal error"` in logs. Check if there's a log line containing that string that's not actually a scraper failure (e.g., a dependency warning).

**Fix:** Tighten the metric filter pattern in `main.tf` to match the exact log prefix: `"[scraper-entrypoint] Fatal error"`.

## Manual Operations

### Trigger a manual scrape

**Via UI:** Admin → Integraciones → click "Ejecutar" for the desired fuente

**Via API:**
```bash
# Local
curl -X POST http://localhost:5101/api/v1/admin/ingesta/ARCA/ejecutar-ahora \
  -H "Authorization: Bearer <admin-jwt>"

# AWS
curl -X POST https://api.numerito.app/api/v1/admin/ingesta/ARCA/ejecutar-ahora \
  -H "Authorization: Bearer <admin-jwt>"
```

Replace `ARCA` with `ARBA`, `AGIP`, or `BCRA_FERIADOS` as needed.

### Change scraping cadence (cadenciaDias)

The superadmin can change `cadenciaDias` from the UI (Admin → Integraciones → Configuraciones).
This updates the database but does **NOT** update the EventBridge schedule automatically.

**To sync the schedule:**
1. Update `cadencia_dias` in `terraform.tfvars` for the target fuente
2. Run `terraform plan` to verify only the schedule expression changes
3. Run `terraform apply`

See [README.md — Syncing cadenciaDias Changes](./README.md#syncing-cadenciadias-changes-from-the-ui)
for the full procedure and rationale.

### Disable a scraper temporarily

**Via UI:** Admin → Integraciones → Configuraciones → toggle "Habilitado"

**Via Terraform:** Set `enabled = false` in `scraper_configs` for the target fuente.

### View execution history

**Via UI:** Admin → Integraciones → Ejecuciones

**Via API:**
```bash
curl "http://localhost:5101/api/v1/admin/ingesta/ejecuciones?fuente=ARCA" \
  -H "Authorization: Bearer <admin-jwt>"
```

## Adding a New Fuente

All 4 fuentes (ARCA, ARBA, AGIP, BCRA_FERIADOS) are already implemented. To add a new one:

1. Add the fuente to `FUENTES_INGESTA` in `configuracion-ingesta.entity.ts`
2. Create the scraper: `apps/backend/src/integraciones/infrastructure/adapters/scraper-calendario-{fuente}.ts`
3. Create the HTML parser + fixtures + tests
4. Register in `createScraper()` switch in `scraper-entrypoint.ts` (exhaustive — TypeScript will error on missing cases)
5. Add to `scraper_configs` in Terraform `terraform.tfvars`:
   ```hcl
   NEW_FUENTE = { enabled = true, cadencia_dias = 7, meses_adelante = 0, cpu = 512, memory = 1024 }
   ```
6. Apply Terraform and update `SCRAPER_TASK_DEFINITION_ARNS` for the backend
