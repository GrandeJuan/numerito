# ── Core ──

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# ── Networking ──

variable "vpc_id" {
  description = "VPC ID where Fargate tasks run"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for Fargate tasks (needs NAT for internet access)"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group allowing outbound HTTPS (443) for scraping + backend callback"
  type        = string
}

# ── ECS ──

variable "ecs_cluster_arn" {
  description = "ARN of the ECS cluster to run scraper tasks in"
  type        = string
}

variable "ecr_repository_url" {
  description = "ECR repository URL for the scraper image (e.g. 123456789.dkr.ecr.us-east-1.amazonaws.com/numerito-scraper)"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag for the scraper"
  type        = string
  default     = "latest"
}

# ── Backend ──

variable "backend_url" {
  description = "Base URL of the NestJS backend (e.g. https://api.numerito.app)"
  type        = string
}

variable "ingesta_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the ingesta webhook shared secret"
  type        = string
}

# ── Scraper config ──

variable "scraper_configs" {
  description = "Per-fuente scraper configuration"
  type = map(object({
    enabled         = bool
    cadencia_dias   = number
    meses_adelante  = number
    cpu             = number   # Fargate CPU units (256 = 0.25 vCPU)
    memory          = number   # Fargate memory in MiB
  }))
  default = {
    ARCA = {
      enabled         = true
      cadencia_dias   = 7
      meses_adelante  = 1
      cpu             = 512
      memory          = 1024
    }
    ARBA = {
      enabled         = true
      cadencia_dias   = 7
      meses_adelante  = 0
      cpu             = 512
      memory          = 1024
    }
    AGIP = {
      enabled         = true
      cadencia_dias   = 7
      meses_adelante  = 0
      cpu             = 512
      memory          = 1024
    }
    BCRA_FERIADOS = {
      enabled         = true
      cadencia_dias   = 30
      meses_adelante  = 0
      cpu             = 256
      memory          = 512
    }
  }
}

# ── Alarms ──

variable "alarm_consecutive_failures" {
  description = "Number of consecutive scraper failures before CloudWatch alarm fires"
  type        = number
  default     = 3
}

variable "alarm_email" {
  description = "Email address for scraper failure alerts (SNS subscription)"
  type        = string
}
