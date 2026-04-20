output "task_definition_arns" {
  description = "ARNs of the ECS task definitions (one per fuente)"
  value       = { for k, v in aws_ecs_task_definition.scraper : k => v.arn }
}

output "scheduler_arns" {
  description = "ARNs of the EventBridge schedules (one per enabled fuente)"
  value       = { for k, v in aws_scheduler_schedule.scraper : k => v.arn }
}

output "log_group_name" {
  description = "CloudWatch log group for scraper tasks"
  value       = aws_cloudwatch_log_group.scraper.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for scraper failure alerts"
  value       = aws_sns_topic.scraper_alerts.arn
}

output "alarm_arn" {
  description = "CloudWatch alarm ARN for consecutive failures"
  value       = aws_cloudwatch_metric_alarm.scraper_failures.arn
}
