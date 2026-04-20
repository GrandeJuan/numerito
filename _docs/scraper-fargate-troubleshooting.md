# Scraper ARCA — Fargate Troubleshooting

## Architecture Overview

```
EventBridge Scheduler → ECS Fargate Task (Playwright + Chromium)
                              │
                              ├── scrapes seti.afip.gob.ar/av/
                              │
                              └── POST /api/v1/admin/ingesta/ARCA/resultado
                                    │
                                    └── Backend processes → PROPUESTA rules
```

## Common Issues

### 1. Fargate task fails to start

**Symptoms:** Task enters STOPPED state immediately.

**Check:**
```bash
# View task stop reason
aws ecs describe-tasks --cluster $CLUSTER --tasks $TASK_ARN \
  --query 'tasks[0].{stopCode:stopCode,stoppedReason:stoppedReason}'

# Common causes:
# - "Essential container exited": check CloudWatch logs
# - "CannotPullContainerError": ECR image not found or IAM permission issue
# - "ResourceNotFoundException": task definition doesn't exist
```

**Fix:**
- Verify ECR image exists: `aws ecr describe-images --repository-name numerito-scraper`
- Verify task execution role has `AmazonECSTaskExecutionRolePolicy`
- Check subnets have NAT gateway for internet access (Fargate tasks need outbound HTTPS)

### 2. Scraper returns empty reglas

**Symptoms:** EjecucionIngesta shows EXITOSA but 0 new/modified rules.

**Check CloudWatch logs:**
```bash
aws logs filter-log-events \
  --log-group-name /ecs/numerito-prod-scraper \
  --filter-pattern "Scrape complete"
```

**Likely causes:**
- ARCA changed their HTML structure → parser returns empty
- The `select[name="periodo"]` element no longer exists
- ARCA page requires JavaScript that Playwright didn't wait for

**Fix:**
1. Download current ARCA page manually: visit `seti.afip.gob.ar/av/seleccionVencimientos.do`
2. Compare against fixtures in `apps/backend/src/integraciones/infrastructure/adapters/__fixtures__/`
3. Update `arca-html-parser.ts` regex patterns or table selectors
4. Add new fixture, update tests, redeploy

### 3. Backend rejects POST resultado (401)

**Symptoms:** Fargate logs show `Backend rejected resultado: HTTP 401`.

**Check:**
- `INGESTA_SECRET` env var matches between Fargate task and backend
- Secrets Manager ARN in Terraform matches the actual secret
- Backend has `INGESTA_SECRET` env var configured

```bash
# Verify secret exists
aws secretsmanager get-secret-value --secret-id $SECRET_ARN --query SecretString

# Verify ECS task can read it
aws iam simulate-principal-policy \
  --policy-source-arn $TASK_EXECUTION_ROLE_ARN \
  --action-names secretsmanager:GetSecretValue \
  --resource-arns $SECRET_ARN
```

### 4. Backend rejects POST resultado (400 validation error)

**Symptoms:** Fargate logs show `HTTP 400` with Zod validation errors.

**Likely cause:** Parser produced invalid data (e.g., `diaVencimiento: 0`, empty `tipoObligacion`).

**Fix:**
1. Check parser output in CloudWatch logs (the reglas are logged)
2. Update `arca-html-parser.ts` to handle the new data format
3. Add fixture test for the new HTML structure

### 5. EventBridge schedule not firing

**Check:**
```bash
# List schedules
aws scheduler list-schedules --group-name default \
  --query 'Schedules[?contains(Name, `scraper`)]'

# Check schedule state
aws scheduler get-schedule --name numerito-prod-scraper-arca \
  --query '{State:State,Expression:ScheduleExpression,Target:Target.Arn}'
```

**Fix:**
- Ensure `habilitado = true` in `configuracion_ingesta` (controls Terraform `enabled` flag)
- Verify EventBridge scheduler IAM role can `ecs:RunTask` and `iam:PassRole`
- Check `flexible_time_window` — task may fire up to 30min after scheduled time

### 6. Consecutive failure CloudWatch alarm

**Trigger:** `ScraperFatalErrors` metric ≥ 1 for N consecutive evaluation periods.

**Response:**
1. Check CloudWatch logs for "Fatal error" pattern
2. Most common: ARCA changed HTML structure → update parser
3. If network issue: check VPC NAT gateway, security group outbound rules
4. Disable the source temporarily: `PATCH /v1/admin/ingesta/configuraciones` with `habilitado: false`

## Manual Operations

### Trigger scraping manually

**Via API (admin token):**
```bash
curl -X POST https://api.numerito.app/api/v1/admin/ingesta/ARCA/ejecutar-ahora \
  -H "Authorization: Bearer $ADMIN_JWT"
```

**Via AWS CLI (launch Fargate task directly):**
```bash
aws ecs run-task \
  --cluster numerito-prod \
  --task-definition numerito-prod-scraper-arca \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET],securityGroups=[$SG],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"scraper","environment":[{"name":"DISPARADOR","value":"MANUAL"}]}]}'
```

### Post scraping results manually

If the Fargate task is down but you have scraping results:

```bash
curl -X POST https://api.numerito.app/api/v1/admin/ingesta/ARCA/resultado \
  -H "Content-Type: application/json" \
  -H "x-ingesta-secret: $INGESTA_SECRET" \
  -d @resultado.json
```

### Check execution history

```bash
curl https://api.numerito.app/api/v1/admin/ingesta/ejecuciones?fuente=ARCA \
  -H "Authorization: Bearer $ADMIN_JWT"
```

## Environment Variables

### Fargate task

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKEND_URL` | Yes | — | Backend base URL (e.g., `https://api.numerito.app`) |
| `INGESTA_SECRET` | Yes | — | Shared secret for webhook auth (from Secrets Manager) |
| `FUENTE` | No | `ARCA` | Source to scrape |
| `MESES_ADELANTE` | No | `0` | Additional future months to scrape |
| `DISPARADOR` | No | `SCHEDULE` | `SCHEDULE` or `MANUAL` |
| `DISPARADO_POR` | No | — | User ID for manual triggers |

### Backend (for webhook auth)

| Variable | Required | Description |
|----------|----------|-------------|
| `INGESTA_SECRET` | Yes | Must match Fargate task's secret |
| `ECS_CLUSTER_ARN` | No | For ejecutar-ahora to launch Fargate tasks |
| `SCRAPER_TASK_DEFINITION_ARNS` | No | JSON map: `{"ARCA":"arn:..."}` |
| `SCRAPER_SUBNETS` | No | Comma-separated subnet IDs |
| `SCRAPER_SECURITY_GROUPS` | No | Comma-separated SG IDs |

## Docker Build

```bash
# From repo root
docker build -f infra/fargate-scraper/Dockerfile -t numerito-scraper .

# Test locally
docker run --rm \
  -e BACKEND_URL=http://host.docker.internal:5101 \
  -e INGESTA_SECRET=dev-secret \
  -e FUENTE=ARCA \
  numerito-scraper
```
