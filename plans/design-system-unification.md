# Plan: UX Design System Unification

> Source PRD: [GrandeJuan/numerito#135](https://github.com/GrandeJuan/numerito/issues/135)

## Architectural decisions

Durable decisions that apply across all phases:

- **Design tokens**: Single `lib/design-tokens.ts` file as the source of truth for all colors, badge classes, and shared styles
- **Brand palette**: Primary `#091426`, Accent `#4edea3`, Secondary accent `#00a472`, Light bg `#faf8ff`, Dark bg `#0d1f3c`, Card dark `#162a4a`
- **Sidebar**: Responsive to theme — light mode `bg-[#f0f4f8]` / dark mode `bg-[#091426]`
- **Font**: Inter applied globally via globals.css, not per-page
- **Badge system**: Amber=Pendiente/Warning, Emerald=Success/Activo, Red=Error/Vencido, Blue=Info, Indigo=Roles
- **KPI icons**: All use `bg-[#4edea3]/10 text-[#4edea3]` consistently
- **Primary buttons**: `bg-[#091426]` matching login CTA
- **Dark mode**: Brand dark `#0d1f3c` for content, `#162a4a` for cards — not generic gray

---

## Phase 1: Foundation — Design tokens, global font, CSS variables

**User stories**: 6, 12, 13

### What to build

Create the design tokens module that all other phases depend on. This exports STATUS_COLORS, ROL_COLORS, PRIORIDAD_COLORS, KPI_ICON_STYLE, card classes, table classes, and button classes as reusable constants. Apply Inter as the global font in globals.css (removing the per-page `font-[Inter]` from the login page). Update the content area background in the root layout/globals to use brand colors. This phase touches no page files — it only creates the foundation and updates globals.

### Acceptance criteria

- [ ] `lib/design-tokens.ts` exists with BRAND, STATUS_COLORS, ROL_COLORS, PRIORIDAD_COLORS, KPI_ICON_STYLE, CARD_CLASSES, TABLE_CLASSES, BUTTON_PRIMARY exports
- [ ] Every status key (Pendiente, Presentado, Vencido, Activo, Inactivo, Emitida, etc.) maps to a className string with both light and dark variants
- [ ] Inter font applied globally — login page no longer has explicit `font-[Inter]`
- [ ] globals.css updated with brand background colors for light/dark content area
- [ ] Unit tests for design tokens (all keys resolve to non-empty strings)
- [ ] Existing tests still pass (no page changes yet)

---

## Phase 2: Shell — Sidebar theming, topbar, content area

**User stories**: 3, 11

### What to build

Refactor the protected-layout sidebar to respond to light/dark mode. In light mode: light background, dark text, subtle borders. In dark mode: current dark navy background. Update the topbar to use brand colors instead of generic grays. Update the content area `<main>` wrapper to use `bg-[#faf8ff]` light / `bg-[#0d1f3c]` dark. The estudio selector, notification bell, and breadcrumbs all adapt their text/icon colors to the current sidebar theme. This is the biggest visual change — the entire app shell transforms.

### Acceptance criteria

- [ ] Sidebar in light mode: `bg-[#f0f4f8]`, `text-[#091426]`, border `border-[#e2e8f0]`
- [ ] Sidebar in dark mode: `bg-[#091426]`, `text-white` (current behavior preserved)
- [ ] Active nav item: light `bg-[#4edea3]/15 text-[#091426]` / dark `bg-[#4edea3]/15 text-[#4edea3]`
- [ ] Logo accent `#4edea3` consistent in both modes
- [ ] Topbar uses brand colors instead of `bg-white`/`border-gray-200`
- [ ] Content area: `bg-[#faf8ff]` light / `bg-[#0d1f3c]` dark
- [ ] EstudioSelector text adapts to sidebar theme
- [ ] NotificationBell adapts to sidebar theme
- [ ] Breadcrumbs text uses brand colors
- [ ] Protected layout tests updated and passing

---

## Phase 3: Studio dashboard pages — KPIs, cards, tables, badges, charts

**User stories**: 1, 2, 4, 5, 8, 14

### What to build

Apply design tokens to all 7 studio dashboard pages: home, clientes, obligaciones, facturacion, contabilidad, tareas, configuracion. Replace local color maps with imports from design-tokens. Update card classes to use brand shadows and dark mode colors. Update KPI icons to use unified `#4edea3` accent. Update table headers, row hovers, and badge styles. Update recharts themes (fill colors, tooltips, grid lines). Update primary action buttons (Presentar, etc.) to use navy CTA style. Remove all local ESTADO_COLORS, PRIORIDAD_COLORS, ROL_COLORS objects — import from tokens instead.

### Acceptance criteria

- [ ] All 7 studio pages import from `lib/design-tokens.ts` — no local color map objects remain
- [ ] KPI icons across all pages use `bg-[#4edea3]/10 text-[#4edea3]`
- [ ] Cards use `bg-white shadow-sm shadow-[#091426]/5 border-[#e2e8f0]` light / `bg-[#162a4a] border-white/10` dark
- [ ] Table headers use `bg-[#f0f4f8] dark:bg-[#162a4a]`
- [ ] Table row hover uses `hover:bg-[#4edea3]/5`
- [ ] Table header text: `text-[#45474c] text-xs font-semibold uppercase tracking-wider`
- [ ] Status badges consistent: amber=Pendiente, emerald=Presentado/Activo, red=Vencido, blue=Info
- [ ] Primary buttons use `bg-[#091426]` navy CTA style
- [ ] Recharts: `#4edea3` primary fill, `#091426` secondary, brand-styled tooltips
- [ ] All existing page tests updated and passing

---

## Phase 4: Admin pages — same treatment

**User stories**: 9

### What to build

Apply the same design token treatment to the 3 admin pages: admin dashboard, estudios, usuarios. Replace local color objects, update KPI cards, tables, badges, and charts to use shared tokens. Ensure the admin panel feels visually identical to the studio dashboard in terms of design language.

### Acceptance criteria

- [ ] Admin dashboard KPIs use brand accent icons
- [ ] Admin estudios table uses brand table styles (header, hover, badges)
- [ ] Admin usuarios KPI cards + table use brand styles
- [ ] Role badges import from shared ROL_COLORS
- [ ] Status badges (Activo/Inactivo) import from shared STATUS_COLORS
- [ ] All admin page tests updated and passing

---

## Phase 5: Portal pages + notification bell

**User stories**: 7, 10

### What to build

Apply design tokens to the 3 portal pages (dashboard, documentos, obligaciones) and the notification bell dropdown. Portal pages get brand cards, tables, and badge colors. The notification bell dropdown gets brand-styled background, hover states, and tipo-specific icon colors from the shared tokens. Final visual QA pass — screenshot every page in light and dark mode to verify consistency.

### Acceptance criteria

- [ ] Portal dashboard KPIs and cards use brand styles
- [ ] Portal documentos cards use brand styles
- [ ] Portal obligaciones table and badges use shared tokens
- [ ] Notification bell dropdown: brand background, hover states, consistent icon colors
- [ ] All portal page tests updated and passing
- [ ] Visual check: every page in light mode uses `#faf8ff` bg, brand cards, brand tables
- [ ] Visual check: every page in dark mode uses `#0d1f3c` bg, `#162a4a` cards
- [ ] No remaining hardcoded color maps in any page file (grep for local ESTADO_COLORS/ROL_COLORS/PRIORIDAD_COLORS returns 0)
