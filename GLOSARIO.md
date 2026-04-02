# Glosario de Lenguaje Ubicuo — Numerito

Fuente de verdad para la terminología de dominio del proyecto.
Usado por la skill `/lenguaje-ubicuo` para auditar consistencia.

```json
{
  "projectName": "Numerito",
  "domainLanguage": "es",
  "terms": [
    {
      "canonical": "estudio",
      "forbidden": ["tenant", "company", "organization", "firm"],
      "context": "Estudio contable — la unidad de multi-tenancy",
      "replacements": {
        "tenantId": "estudioId",
        "tenant_id": "estudio_id",
        "_tenantId": "_estudioId",
        "TenantModule": "EstudioModule",
        "TenantContextMiddleware": "EstudioContextMiddleware",
        "TenantRequiredGuard": "EstudioRequiredGuard",
        "TenantId": "EstudioId",
        "TENANT_ID_HEADER": "ESTUDIO_ID_HEADER",
        "TENANT_ID": "ESTUDIO_ID",
        "x-tenant-id": "x-estudio-id"
      },
      "exceptions": ["multi-tenant (en comentarios de arquitectura)"]
    },
    {
      "canonical": "usuario",
      "forbidden": ["user"],
      "context": "Usuarios del sistema (IAM)",
      "exceptions": ["Express request.user (framework convention)", "CurrentUser decorator (NestJS convention)"]
    },
    {
      "canonical": "cliente",
      "forbidden": ["client", "customer"],
      "context": "Clientes del estudio contable (personas fisicas/juridicas)",
      "exceptions": ["HTTP client (infrastructure)"]
    },
    {
      "canonical": "factura",
      "forbidden": ["invoice", "bill"],
      "context": "Facturacion del estudio a sus clientes"
    },
    {
      "canonical": "vencimiento",
      "forbidden": ["deadline", "dueDate", "due_date"],
      "context": "Vencimientos de obligaciones fiscales"
    },
    {
      "canonical": "obligacion",
      "forbidden": ["obligation", "duty"],
      "context": "Obligaciones fiscales (IVA, Ganancias, IIBB, etc.)"
    },
    {
      "canonical": "tarea",
      "forbidden": ["task", "todo"],
      "context": "Tareas internas del estudio",
      "exceptions": ["NestJS task scheduling (infrastructure)"]
    },
    {
      "canonical": "empleado",
      "forbidden": ["employee", "worker"],
      "context": "Empleados de los clientes del estudio"
    },
    {
      "canonical": "documento",
      "forbidden": ["document", "file"],
      "context": "Documentos del repositorio por cliente",
      "exceptions": ["DOM Document (frontend)", "Swagger document (infrastructure)"]
    },
    {
      "canonical": "asiento",
      "forbidden": ["entry", "journalEntry", "journal_entry"],
      "context": "Asientos contables (devengamiento)"
    },
    {
      "canonical": "libro",
      "forbidden": ["book", "ledger", "journal"],
      "context": "Libros contables (IVA, Diario, etc.)"
    },
    {
      "canonical": "nomina",
      "forbidden": ["payroll"],
      "context": "Liquidacion de sueldos y haberes"
    },
    {
      "canonical": "subscripcion",
      "forbidden": ["subscription"],
      "context": "Plan de subscripcion del estudio"
    },
    {
      "canonical": "permiso",
      "forbidden": ["permission"],
      "context": "Permisos de acceso por rol",
      "exceptions": ["NestJS permission decorators"]
    },
    {
      "canonical": "sesion",
      "forbidden": ["session"],
      "context": "Sesiones activas del usuario",
      "exceptions": ["Express session (framework)"]
    }
  ]
}
```
