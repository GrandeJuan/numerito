# Redesign Components

Componentes del rediseño en curso. Conviven con los viejos hasta que la migración esté completa (Fase 12).

**Reglas:**

- No importar de `@/components/shared/*` (esos son los viejos); si hace falta algo compartido, copiarlo/reescribirlo acá.
- Usar solo tokens nuevos (`--surface`, `--text`, `--brand`, etc.) — no colores hardcodeados.
- Cada componente debe funcionar en light y dark sin excepciones.
- Los tests van junto al componente: `button.tsx` → `button.spec.tsx`.
