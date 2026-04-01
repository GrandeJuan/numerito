# Frontend — Next.js + shadcn/ui + Tailwind

## Stack
- Next.js App Router (no Pages Router)
- shadcn/ui como sistema de componentes base
- Tailwind CSS para estilos
- Puerto frontend: 3000

## Reglas de Componentes
1. **SIEMPRE** buscar en shadcn/ui y `components/` existentes antes de crear uno nuevo
2. Refactorizar/extender componente existente antes de duplicar
3. Composicion sobre herencia — componentes pequenos y componibles
4. Un componente = una responsabilidad
5. No reinventar UI que shadcn ya tiene
6. Colocacion: componentes de pagina en su carpeta, solo reutilizables en `components/` global

## Estructura
```
app/
  (auth)/           # rutas publicas (login, registro)
  (dashboard)/      # rutas protegidas
    clientes/
    obligaciones/
    contabilidad/
    ...
  layout.tsx
  page.tsx
components/
  ui/               # shadcn/ui components
  shared/           # componentes reutilizables propios
lib/
  api/              # fetch wrappers al backend
  hooks/            # custom hooks
  utils/            # utilidades
```

## Convenciones
- Archivos de componentes: `kebab-case.tsx`
- Componentes: `PascalCase` export
- Hooks: `use-{nombre}.ts`
- Server Components por defecto, `"use client"` solo cuando sea necesario
- Ejecutar `/react-doctor` al crear/modificar componentes
