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
});
