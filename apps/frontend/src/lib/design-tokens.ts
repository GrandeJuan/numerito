/**
 * Numerito design tokens — unified system.
 *
 * Target visual: mockup `Dashboard Graphs.html`.
 * Dark es el tema DEFAULT; light es la variante (`html[data-theme="light"]`).
 * Los componentes consumen CSS variables (ver globals.css) y el objeto `tokens`
 * se usa solo donde se necesita un string JS (Recharts, SVG inline, cálculos).
 */

export const tokens = {
  /* ===== DARK (default) ===== */
  bg:            '#0a0f0d',
  surface:       '#111715',
  surface2:      '#161d1b',
  border:        '#1f2724',
  borderStrong:  '#2a322f',
  text:          '#f1f4f2',
  text2:         '#a9b1ae',
  text3:         '#6e7673',
  text4:         '#4a5250',

  brand:         '#2ee6a8',
  brandInk:      '#a7f3d0',
  brandOn:       '#052e1b',
  brandSoft:     '#0f3b2e',
  brandSofter:   '#0a271f',

  amber:         '#fbbf24',
  amberInk:      '#fde68a',
  amberSoft:     '#3b2a0a',
  rose:          '#fb7185',
  roseInk:       '#fecdd3',
  roseSoft:      '#3b1017',
  indigo:        '#a5b4fc',
  indigoInk:     '#c7d2fe',
  indigoSoft:    '#1e1b4b',
  blue:          '#7dd3fc',
  blueInk:       '#bae6fd',
  blueSoft:      '#0c2840',

  sidebar:       '#060908',
  sidebar2:      '#0c1110',
  sidebarText:   '#e7eae8',
  sidebarMuted:  '#8a9290',

  /* ===== LIGHT ===== */
  lightBg:           '#f6f7f8',
  lightSurface:      '#ffffff',
  lightSurface2:     '#fafbfc',
  lightBorder:       '#e6e8eb',
  lightBorderStrong: '#d3d7dc',
  lightText:         '#0b0f14',
  lightText2:        '#4b5563',
  lightText3:        '#8a9199',
  lightText4:        '#b0b6bd',

  lightBrand:        '#10b981',
  lightBrandInk:     '#065f46',
  lightBrandSoft:    '#d1fae5',
  lightBrandSofter:  '#ecfdf5',

  lightAmber:        '#f59e0b',
  lightAmberSoft:    '#fef3c7',
  lightRose:         '#e11d48',
  lightRoseSoft:     '#ffe4e6',
  lightIndigo:       '#6366f1',
  lightIndigoSoft:   '#e0e7ff',
  lightBlue:         '#0284c7',
  lightBlueSoft:     '#e0f2fe',

  lightSidebar:      '#0a0f0d',
  lightSidebar2:     '#111715',
} as const;

/** Tonal mapping para pills/estados. Consume CSS vars. */
export const STATUS_TONES = {
  PENDIENTE:    { bar: 'var(--amber)',  soft: 'var(--amber-soft)',  ink: 'var(--amber-ink)'  },
  PRESENTADO:   { bar: 'var(--brand)',  soft: 'var(--brand-soft)',  ink: 'var(--brand-ink)'  },
  VENCIDO:      { bar: 'var(--rose)',   soft: 'var(--rose-soft)',   ink: 'var(--rose-ink)'   },
  PAGADA:       { bar: 'var(--brand)',  soft: 'var(--brand-soft)',  ink: 'var(--brand-ink)'  },
  VENCIDA:      { bar: 'var(--rose)',   soft: 'var(--rose-soft)',   ink: 'var(--rose-ink)'   },
  PARCIAL:      { bar: 'var(--indigo)', soft: 'var(--indigo-soft)', ink: 'var(--indigo-ink)' },
  EN_PROGRESO:  { bar: 'var(--indigo)', soft: 'var(--indigo-soft)', ink: 'var(--indigo-ink)' },
  COMPLETADO:   { bar: 'var(--brand)',  soft: 'var(--brand-soft)',  ink: 'var(--brand-ink)'  },
} as const;

export type StatusToneKey = keyof typeof STATUS_TONES;
