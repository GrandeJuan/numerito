terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "numerito"
      Module      = "fargate-scraper"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  prefix = "numerito-${var.environment}"
}

# ─────────────────────────────────────────────────────────
# IAM — Task execution role (ECS agent: pull image, logs)
# ─────────────────────────────────────────────────────────

resource "aws_iam_role" "task_execution" {
  name = "${local.prefix}-scraper-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution_managed" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow reading the ingesta secret for container env injection
resource "aws_iam_role_policy" "task_execution_secrets" {
  name = "secrets-access"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [var.ingesta_secret_arn]
    }]
  })
}

# ─────────────────────────────────────────────────────────
# IAM — Task role (application: what the container can do)
# ─────────────────────────────────────────────────────────

resource "aws_iam_role" "task" {
  name = "${local.prefix}-scraper-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Scraper task only needs outbound HTTPS — no AWS API calls.
# Role exists for future extensions (e.g., writing to S3 for debug snapshots).

# ─────────────────────────────────────────────────────────
# CloudWatch Log Group
# ─────────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "scraper" {
  name              = "/ecs/${local.prefix}-scraper"
  retention_in_days = 30
}

# ─────────────────────────────────────────────────────────
# ECS Task Definition (one per fuente)
# ─────────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "scraper" {
  for_each = var.scraper_configs

  family                   = "${local.prefix}-scraper-${lower(each.key)}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name      = "scraper"
    image     = "${var.ecr_repository_url}:${var.image_tag}"
    essential = true

    environment = [
      { name = "BACKEND_URL", value = var.backend_url },
      { name = "FUENTE", value = each.key },
      { name = "MESES_ADELANTE", value = tostring(each.value.meses_adelante) },
      { name = "DISPARADOR", value = "SCHEDULE" },
    ]

    secrets = [
      {
        name      = "INGESTA_SECRET"
        valueFrom = var.ingesta_secret_arn
      },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.scraper.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = lower(each.key)
      }
    }
  }])
}

# ─────────────────────────────────────────────────────────
# IAM — EventBridge Scheduler role (to run ECS tasks)
# ─────────────────────────────────────────────────────────

resource "aws_iam_role" "scheduler" {
  name = "${local.prefix}-scraper-scheduler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "scheduler_run_task" {
  name = "run-ecs-task"
  role = aws_iam_role.scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ecs:RunTask"]
        Resource = [for td in aws_ecs_task_definition.scraper : td.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = [
          aws_iam_role.task_execution.arn,
          aws_iam_role.task.arn,
        ]
      },
    ]
  })
}

# ─────────────────────────────────────────────────────────
# EventBridge Scheduler (one schedule per enabled fuente)
# ─────────────────────────────────────────────────────────

resource "aws_scheduler_schedule" "scraper" {
  for_each = { for k, v in var.scraper_configs : k => v if v.enabled }

  name       = "${local.prefix}-scraper-${lower(each.key)}"
  group_name = "default"

  schedule_expression          = "rate(${each.value.cadencia_dias} days)"
  schedule_expression_timezone = "America/Argentina/Buenos_Aires"

  flexible_time_window {
    mode                      = "FLEXIBLE"
    maximum_window_in_minutes = 30
  }

  target {
    arn      = var.ecs_cluster_arn
    role_arn = aws_iam_role.scheduler.arn

    ecs_parameters {
      task_definition_arn = aws_ecs_task_definition.scraper[each.key].arn
      launch_type         = "FARGATE"
      task_count          = 1

      network_configuration {
        subnets          = var.private_subnet_ids
        security_groups  = [var.security_group_id]
        assign_public_ip = false
      }
    }
  }
}

# ─────────────────────────────────────────────────────────
# SNS Topic for scraper failure alerts
# ─────────────────────────────────────────────────────────

resource "aws_sns_topic" "scraper_alerts" {
  name = "${local.prefix}-scraper-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.scraper_alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# ─────────────────────────────────────────────────────────
# CloudWatch Alarm — consecutive task failures
# ─────────────────────────────────────────────────────────

# Metric filter: count non-zero exit codes from ECS task logs
resource "aws_cloudwatch_log_metric_filter" "scraper_fatal" {
  name           = "${local.prefix}-scraper-fatal"
  log_group_name = aws_cloudwatch_log_group.scraper.name
  pattern        = "\"Fatal error\""

  metric_transformation {
    name          = "ScraperFatalErrors"
    namespace     = "Numerito/Scraper"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "scraper_failures" {
  alarm_name          = "${local.prefix}-scraper-consecutive-failures"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = var.alarm_consecutive_failures
  metric_name         = "ScraperFatalErrors"
  namespace           = "Numerito/Scraper"
  period              = 86400 # 1 day (aligned with cadencia_dias minimum)
  statistic           = "Maximum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  alarm_description = "Scraper task has failed ${var.alarm_consecutive_failures} consecutive times"
  alarm_actions     = [aws_sns_topic.scraper_alerts.arn]
  ok_actions        = [aws_sns_topic.scraper_alerts.arn]
}
