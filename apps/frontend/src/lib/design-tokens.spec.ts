import { describe, it, expect } from 'vitest';
import {
  BRAND,
  STATUS_COLORS,
  ROL_COLORS,
  PRIORIDAD_COLORS,
  KPI_ICON_STYLE,
  CARD_CLASSES,
  TABLE_CLASSES,
  BUTTON_PRIMARY,
  CHART_THEME,
} from './design-tokens';

describe('design-tokens', () => {
  it('BRAND contains all required colors', () => {
    expect(BRAND.primary).toBe('#091426');
    expect(BRAND.accent).toBe('#4edea3');
    expect(BRAND.lightBg).toBe('#faf8ff');
    expect(BRAND.darkBg).toBe('#0d1f3c');
    expect(BRAND.cardDark).toBe('#162a4a');
  });

  it('STATUS_COLORS maps all keys to non-empty className strings', () => {
    const expectedKeys = [
      'Pendiente',
      'Cumplido',
      'Presentada',
      'Vencido',
      'Pagada',
      'Activo',
      'Inactivo',
      'PENDIENTE',
      'PRESENTADO',
      'VENCIDO',
      'ACTIVO',
      'INACTIVO',
      'EMITIDA',
      'PARCIALMENTE_PAGADA',
      'PAGADA',
      'VENCIDA',
      'ANULADA',
    ];
    for (const key of expectedKeys) {
      expect(STATUS_COLORS[key], `STATUS_COLORS['${key}']`).toBeTruthy();
      expect(typeof STATUS_COLORS[key]).toBe('string');
      expect(STATUS_COLORS[key].length).toBeGreaterThan(0);
    }
  });

  it('ROL_COLORS maps all keys to non-empty className strings', () => {
    for (const key of ['SUPERADMIN', 'SOCIO', 'RESPONSABLE', 'EMPLEADO', 'CLIENTE']) {
      expect(ROL_COLORS[key]).toBeTruthy();
      expect(ROL_COLORS[key].length).toBeGreaterThan(0);
    }
  });

  it('PRIORIDAD_COLORS maps all keys to non-empty className strings', () => {
    for (const key of ['BAJA', 'MEDIA', 'ALTA', 'URGENTE']) {
      expect(PRIORIDAD_COLORS[key]).toBeTruthy();
      expect(PRIORIDAD_COLORS[key].length).toBeGreaterThan(0);
    }
  });

  it('KPI_ICON_STYLE has brand accent className', () => {
    expect(KPI_ICON_STYLE.className).toContain('#4edea3');
  });

  it('CARD_CLASSES has light and dark variants', () => {
    expect(CARD_CLASSES.full).toContain('bg-white');
    expect(CARD_CLASSES.full).toContain('dark:bg-[#162a4a]');
  });

  it('TABLE_CLASSES has brand header and hover', () => {
    expect(TABLE_CLASSES.header).toContain('#f0f4f8');
    expect(TABLE_CLASSES.rowHover).toContain('#4edea3');
  });

  it('BUTTON_PRIMARY matches login CTA style', () => {
    expect(BUTTON_PRIMARY).toContain('#091426');
    expect(BUTTON_PRIMARY).toContain('font-bold');
  });

  it('CHART_THEME uses brand colors', () => {
    expect(CHART_THEME.primaryFill).toBe('#4edea3');
    expect(CHART_THEME.secondaryFill).toBe('#091426');
  });
});
