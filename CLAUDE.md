# Numerito — ERP Contable Argentino

## Vision
ERP contable argentino para estudios contables. SaaS multi-tenant.
Cada "estudio" es un tenant con sus propios clientes, obligaciones, facturacion, etc.

## Stack
- **Monorepo:** Turborepo con pnpm workspaces
- **Backend:** NestJS + MikroORM + PostgreSQL (REST API)
- **Frontend:** Next.js (App Router) + shadcn/ui + Tailwind CSS
- **Shared:** Package con types, validaciones Zod, constantes de dominio
- **Infra:** Docker Compose (dev), AWS ECS/Fargate (prod), Terraform

## Bounded Contexts (10)
1. **IAM** — Identidad, autenticacion, roles y permisos
2. **Tenant** — Estudios contables (multi-tenancy)
3. **Clientes** — Clientes del estudio (personas fisicas/juridicas)
4. **Obligaciones** — Vencimientos fiscales, calendario, alertas
5. **Contabilidad** — Libros contables, asientos, balances
6. **Nomina** — Empleados de clientes, liquidacion, recibos
7. **Documentos** — Repositorio documental por cliente (S3)
8. **Tareas** — Gestion interna del estudio, Kanban, horas
9. **Facturacion** — Facturacion del estudio a sus clientes
10. **Integraciones** — ARCA, ARBA, AGIP, notificaciones

## Reglas Generales
- **Idioma de negocio:** Espanol para entidades de dominio (Cliente, Vencimiento, Factura, etc.)
- **Idioma tecnico:** Ingles para infra, config, utils, nombres de archivos tecnicos
- **Estructura:** Monorepo con `apps/backend`, `apps/frontend`, `packages/shared`
- **Branch strategy:** Feature branches desde `main`, PRs con review
- **Commits:** Descriptivos, sin mencionar herramientas de IA
- **Tests:** Obligatorios antes de merge. Usar `/tdd` para features.
