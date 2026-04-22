# Scraper Ingesta — Terraform Module

Terraform module that provisions the AWS infrastructure for the ingesta pipeline:
one ECS Fargate task definition per fuente, EventBridge Scheduler for automatic cadence,
CloudWatch logging, and SNS alerting on consecutive failures.

## Resources Created

| Resource | Count | Description |
|---|---|---|
| ECS Task Definition | 1 per fuente | Fargate task running the scraper container |
| EventBridge Schedule | 1 per **enabled** fuente | `rate(N days)` trigger per fuente |
| CloudWatch Log Group | 1 | Shared `/ecs/{prefix}-scraper`, 30-day retention |
| CloudWatch Metric Filter | 1 | Matches `"Fatal error"` in scraper logs |
| CloudWatch Alarm | 1 | Fires after N consecutive failures → SNS |
| SNS Topic + Subscription | 1 | Email alert to `alarm_email` |
| IAM Roles | 3 | Task execution, task, scheduler |

## Prerequisites

- AWS account with ECS, ECR, EventBridge Scheduler, CloudWatch, SNS, Secrets Manager access
- ECS cluster (existing or created separately)
- ECR repository with the scraper image pushed (`infra/fargate-scraper/Dockerfile`)
- VPC with private subnets + NAT gateway (tasks need outbound HTTPS to official sites + backend)
- Security group allowing outbound TCP 443
- Ingesta webhook secret stored in Secrets Manager
- Terraform >= 1.5, AWS provider ~> 5.0

## Usage

```bash
cd infra/fargate-scraper

# First time: copy and fill in your values
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your AWS account details

terraform init
terraform plan    # review the plan
terraform apply   # create/update resources
```

## Scraper Configs

Each fuente is configured independently via the `scraper_configs` variable:

```hcl
scraper_configs = {
  ARCA = {
    enabled         = true
    cadencia_dias   = 7      # EventBridge rate
    meses_adelante  = 1      # months ahead to scrape
    cpu             = 512    # Fargate CPU units (512 = 0.5 vCPU)
    memory          = 1024   # Fargate memory in MiB
  }
  ARBA          = { enabled = true,  cadencia_dias = 7,  meses_adelante = 0, cpu = 512, memory = 1024 }
  AGIP          = { enabled = true,  cadencia_dias = 7,  meses_adelante = 0, cpu = 512, memory = 1024 }
  BCRA_FERIADOS = { enabled = true,  cadencia_dias = 30, meses_adelante = 0, cpu = 256, memory = 512  }
}
```

- **Task definitions** are created for ALL configs (including disabled).
- **EventBridge schedules** are created only for **enabled** configs.
- Setting `enabled = false` destroys the schedule but keeps the task definition (for manual triggers).

## Connecting to the Backend

After `terraform apply`, the backend needs these environment variables to use `AwsFargateTaskLauncher`:

| Env Var | Source (Terraform output) | Format |
|---|---|---|
| `ECS_CLUSTER_ARN` | (your cluster ARN) | `arn:aws:ecs:region:account:cluster/name` |
| `SCRAPER_TASK_DEFINITION_ARNS` | `task_definition_arns` | JSON map: `{"ARCA":"arn:...","ARBA":"arn:..."}` |
| `SCRAPER_SUBNETS` | (your subnet IDs) | Comma-separated: `subnet-aaa,subnet-bbb` |
| `SCRAPER_SECURITY_GROUPS` | (your SG ID) | Comma-separated: `sg-xxx` |
| `SCRAPER_LOG_GROUP` | `log_group_name` | `/ecs/numerito-prod-scraper` |

When all 5 are set, the backend auto-selects `AwsFargateTaskLauncher`. Otherwise it falls back
to `DockerTaskLauncher` (local) or returns an error if neither is configured.

### Wiring outputs to the backend

After applying, extract the outputs and set them in the backend's environment:

```bash
# Get task definition ARNs as JSON map
terraform output -json task_definition_arns
# → {"ARCA":"arn:aws:ecs:...","ARBA":"arn:aws:ecs:...","AGIP":"arn:aws:ecs:...","BCRA_FERIADOS":"arn:aws:ecs:..."}

# Get log group name
terraform output -raw log_group_name
# → /ecs/numerito-prod-scraper
```

Set these as environment variables in your ECS backend task definition, `.env`, or secrets.

## Syncing `cadenciaDias` Changes from the UI

The superadmin can change `cadenciaDias` per fuente from the admin UI
(`/admin/integraciones` → Configuraciones). This updates the `configuracion_ingesta` row
in Postgres, which controls what the backend *displays* and uses for `proximaEjecucion`
calculations.

**However, the actual EventBridge schedule rate is controlled by Terraform.** Changing
`cadenciaDias` in the UI does NOT automatically update the EventBridge schedule expression.

### Procedure to sync

1. **Superadmin changes cadencia in the UI** (e.g., ARBA from 7 to 14 days).

2. **Update `terraform.tfvars`** to match:
   ```hcl
   ARBA = {
     enabled         = true
     cadencia_dias   = 14   # ← changed from 7
     meses_adelante  = 0
     cpu             = 512
     memory          = 1024
   }
   ```

3. **Apply the change:**
   ```bash
   cd infra/fargate-scraper
   terraform plan   # verify only the ARBA schedule changes
   terraform apply
   ```

4. **Verify** the new schedule in AWS Console → EventBridge → Schedules, or:
   ```bash
   aws scheduler get-schedule \
     --name numerito-prod-scraper-arba \
     --query 'ScheduleExpression'
   # → "rate(14 days)"
   ```

### Why not automate this?

The EventBridge schedule is infrastructure managed by Terraform. Allowing the backend to
call `PutSchedule` directly would create drift between Terraform state and AWS reality,
leading to unpredictable `terraform plan` results and potential resource conflicts.
The manual sync is intentional — it keeps Terraform as the single source of truth for
infrastructure while the UI controls application-level behavior (display, `proximaEjecucion`).

### Future consideration

If the sync becomes frequent, consider one of:
- A CI/CD pipeline that reads `configuracion_ingesta` from the DB and generates `terraform.tfvars` automatically before `terraform apply`.
- An AWS Lambda triggered by DB change events that calls `UpdateSchedule` and imports the change into Terraform state.

Neither is in scope for the current implementation.

## Outputs

| Output | Description |
|---|---|
| `task_definition_arns` | Map of `{fuente => task_definition_arn}` for all configs |
| `scheduler_arns` | Map of `{fuente => scheduler_arn}` for enabled configs only |
| `log_group_name` | CloudWatch log group path |
| `sns_topic_arn` | SNS topic ARN for failure alerts |
| `alarm_arn` | CloudWatch alarm ARN |

## Alarms

The module creates a single CloudWatch alarm that monitors ALL scrapers via a metric filter
on the `"Fatal error"` log pattern. The alarm fires after `alarm_consecutive_failures`
(default: 3) consecutive evaluation periods (1 day each) where at least one fatal error
occurred.

**To test the alarm:**

```bash
# Inject a fake fatal error into the log group
aws logs put-log-events \
  --log-group-name "$(terraform output -raw log_group_name)" \
  --log-stream-name "test/scraper/alarm-test" \
  --log-events timestamp=$(date +%s000),message="Fatal error: alarm test"

# Verify the metric filter picked it up (wait ~1 min)
aws cloudwatch get-metric-statistics \
  --namespace Numerito/Scraper \
  --metric-name ScraperFatalErrors \
  --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
  --period 300 --statistics Maximum

# The alarm will transition to ALARM after N consecutive periods
# Check alarm state:
aws cloudwatch describe-alarms \
  --alarm-names "$(terraform output -raw alarm_arn | grep -oP '[^:]+$')"
```

The SNS email subscription requires confirmation — check the `alarm_email` inbox after
the first `terraform apply` and click the confirmation link.

## See Also

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — common issues, log reading, manual operations
- [.env.example](../../.env.example) — backend environment variables for scraper integration
- [integraciones.module.ts](../../apps/backend/src/integraciones/integraciones.module.ts) — adapter selection logic
