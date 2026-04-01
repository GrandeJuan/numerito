# Shared Package — Types, Zod, Constantes

## Proposito
Types y validaciones compartidos entre frontend y backend.
Evita duplicacion de definiciones de dominio.

## Contenido
- **Types:** Interfaces y tipos TypeScript compartidos
- **Validaciones:** Schemas Zod para validacion en ambos lados
- **Constantes:** Tipos de obligaciones fiscales, roles, condiciones IVA, provincias, etc.

## Estructura
```
src/
  types/            # interfaces TypeScript
  schemas/          # schemas Zod
  constants/        # constantes de dominio
  index.ts          # barrel exports
```

## Reglas
- Solo exportar lo que ambos lados necesitan
- No importar dependencias de NestJS ni Next.js
- Schemas Zod como fuente de verdad para validacion
- Constantes de dominio argentino (CUIT format, condiciones IVA, tipos de obligaciones)
