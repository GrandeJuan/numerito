import { Empleado } from './empleado.entity';

describe('Empleado Entity', () => {
  const createEmpleado = () => {
    return Empleado.create({
      clienteId: 'c1',
      tenantId: 't1',
      nombre: 'Juan',
      apellido: 'Perez',
      cuil: '20-12345678-6',
      fechaIngreso: new Date('2024-01-15'),
      sueldoBasico: 500000,
      categoriaConvenio: 'Administrativo A',
    });
  };

  it('should create an empleado', () => {
    const emp = createEmpleado();
    expect(emp.id).toBeDefined();
    expect(emp.nombre).toBe('Juan');
    expect(emp.sueldoBasico).toBe(500000);
    expect(emp.isActive).toBe(true);
  });

  it('should update sueldo', () => {
    const emp = createEmpleado();
    emp.actualizarSueldo(600000);
    expect(emp.sueldoBasico).toBe(600000);
  });

  it('should calculate antiguedad in years', () => {
    const emp = createEmpleado();
    expect(emp.antiguedadAnios).toBeGreaterThanOrEqual(2);
  });

  it('should deactivate (baja)', () => {
    const emp = createEmpleado();
    emp.darDeBaja(new Date('2026-03-31'));
    expect(emp.isActive).toBe(false);
    expect(emp.fechaEgreso).toEqual(new Date('2026-03-31'));
  });

  it('should reject zero sueldo', () => {
    const emp = createEmpleado();
    expect(() => emp.actualizarSueldo(0)).toThrow('El sueldo debe ser mayor a 0');
  });

  it('should reject negative sueldo', () => {
    const emp = createEmpleado();
    expect(() => emp.actualizarSueldo(-100)).toThrow('El sueldo debe ser mayor a 0');
  });

  it('should expose all getters', () => {
    const emp = createEmpleado();
    expect(emp.clienteId).toBe('c1');
    expect(emp.tenantId).toBe('t1');
    expect(emp.nombre).toBe('Juan');
    expect(emp.apellido).toBe('Perez');
    expect(emp.cuil).toBe('20-12345678-6');
    expect(emp.fechaIngreso).toEqual(new Date('2024-01-15'));
    expect(emp.fechaEgreso).toBeUndefined();
    expect(emp.sueldoBasico).toBe(500000);
    expect(emp.categoriaConvenio).toBe('Administrativo A');
    expect(emp.isActive).toBe(true);
  });
});
