# Scraper Fargate — Troubleshooting

## Architecture Overview

```
EventBridge Scheduler (rate: 7d)
    │
    ▼
ECS Fargate Task (Playwright + Chromium)
    │  scrapes seti.afip.gob.ar/av/
    │
    ▼
POST /api/v1/admin/ingesta/ARCA/resultado
    │
    ▼
ProcesarResultadoScrapingHandler
    │  diff against active rules
    │
    ▼
ReglaVencimiento (estado: PROPUESTA)
    │
    ▼
Superadmin approves/rejects in /admin/reglas-propuestas
```

## Common Issues

### 1. Scraper produces 0 reglas but no errors

**Symptom:** EjecucionIngesta shows EXITOSA with reglasNuevas=0, reglasModificadas=0.

**Likely cause:** ARCA changed their HTML structure. The parser (`arca-html-parser.ts`) uses CSS selectors to find `.tabla-vencimientos` tables.

**Diagnosis:**
1. Check CloudWatch logs: `/ecs/numerito-prod-scraper` → ARCA stream
2. Look for "Conceptos no reconocidos" warnings
3. If no tables found → ARCA changed their DOM

**Fix:**
1. Download current page HTML: `curl -o arca-current.html "https://seti.afip.gob.ar/av/seleccionVencimientos.do"`
2. Compare against fixture: `apps/backend/src/integraciones/infrastructure/adapters/__fixtures__/arca-vencimientos-iva-2026-05.html`
3. Update CSS selectors in `arca-html-parser.ts`
4. Add new fixture, update tests
5. Deploy new Docker image

### 2. Fargate task fails to start

**Symptom:** CloudWatch alarm fires. No logs in log group.

**Likely causes:**
- **ECR image pull failure:** Check IAM role `numerito-prod-scraper-execution` has ECR pull permissions
- **Subnet/SG misconfiguration:** Task needs outbound HTTPS (443) to both `seti.afip.gob.ar` and the backend URL
- **Insufficient capacity:** Rare with Fargate, but possible. Check ECS service events

**Diagnosis:**
```bash
aws ecs describe-tasks --cluster numerito-prod --tasks <task-arn>
# Check "stoppedReason" and "containers[].reason"
```

### 3. Fargate task runs but backend rejects the POST

**Symptom:** Logs show `Backend rejected resultado: HTTP 401` or `HTTP 403`.

**Likely cause:** INGESTA_SECRET mismatch between Secrets Manager and backend environment.

**Fix:**
1. Verify secret in Secrets Manager matches backend's expected value
2. Check that the task definition references the correct secret ARN
3. Redeploy the task definition after updating the secret

### 4. PROPUESTA rules have wrong diaVencimiento

**Symptom:** Superadmin sees propuestas with dates that don't match the ARCA page.

**Likely cause:** The `resolverConcepto` regex matched the wrong row, or ARCA changed column order.

**Diagnosis:**
1. Check the specific concepto in `CONCEPTO_MAP` at `arca-html-parser.ts`
2. Download and inspect the live HTML
3. Compare the fixture parse output vs live parse output

### 5. Task runs but takes > 5 minutes

**Symptom:** Task completes but CloudWatch shows long execution time.

**Likely cause:** `mesesAdelante` is set too high, or ARCA page is slow to respond.

**Mitigation:**
- Default `mesesAdelante=1` is sufficient for most cases
- The task launches a fresh browser per month iteration
- Consider increasing Fargate task timeout if needed

### 6. CloudWatch alarm false positive

**Symptom:** Alarm fires but the scraper actually succeeded.

**Diagnosis:** The metric filter matches on `"Fatal error"` in logs. Check if there's a log line containing that string that's not actually a scraper failure (e.g., a dependency warning).

**Fix:** Tighten the metric filter pattern in `main.tf` to match the exact log prefix: `"[scraper-entrypoint] Fatal error"`.

## Manual Operations

### Trigger a manual scrape

**Via UI:** Admin → Ingesta → "Ejecutar ahora" button

**Via API:**
```bash
curl -X POST https://api.numerito.app/api/v1/admin/ingesta/ARCA/ejecutar-ahora \
  -H "Authorization: Bearer <admin-token>"
```

### Disable a scraper temporarily

**Via UI:** Admin → Ingesta → Configuraciones → toggle "Habilitado"

**Via Terraform:** Set `enabled = false` in `scraper_configs` for the target fuente.

### View execution history

**Via UI:** Admin → Ingesta → Ejecuciones

**Via API:**
```bash
curl "https://api.numerito.app/api/v1/admin/ingesta/ejecuciones?fuente=ARCA" \
  -H "Authorization: Bearer <admin-token>"
```

### Check Fargate task logs

```bash
aws logs tail /ecs/numerito-prod-scraper --filter-pattern "ARCA" --since 1h
```

## Adding a New Scraper (e.g., ARBA)

1. Create the adapter: `apps/backend/src/integraciones/infrastructure/adapters/scraper-calendario-arba.ts`
2. Create HTML fixtures and parser tests
3. Add to `scraper_configs` in `terraform.tfvars`:
   ```hcl
   ARBA = { enabled = true, cadencia_dias = 7, meses_adelante = 0, cpu = 512, memory = 1024 }
   ```
4. Update the Fargate entrypoint to dispatch by `FUENTE` env var (currently hardcoded to `ScraperCalendarioARCA`)
5. Apply Terraform: `terraform apply`
6. Add `SCRAPER_TASK_DEFINITION_ARNS` env var update for the backend
