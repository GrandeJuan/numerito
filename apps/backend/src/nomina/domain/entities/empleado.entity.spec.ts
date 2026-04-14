import { Empleado } from './empleado.entity';

describe('Empleado Entity', () => {
  const createEmpleado = () => {
    return Empleado.create({
      clienteId: 'c1',
      estudioId: 'e1',
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

  it('should reject sueldoBasico <= 0 on create', () => {
    expect(() => Empleado.create({
      clienteId: 'c1',
      estudioId: 'e1',
      nombre: 'Juan',
      apellido: 'Perez',
      cuil: '20-12345678-6',
      fechaIngreso: new Date('2024-01-15'),
      sueldoBasico: 0,
      categoriaConvenio: 'Administrativo A',
    })).toThrow('El sueldo debe ser mayor a 0');

    expect(() => Empleado.create({
      clienteId: 'c1',
      estudioId: 'e1',
      nombre: 'Juan',
      apellido: 'Perez',
      cuil: '20-12345678-6',
      fechaIngreso: new Date('2024-01-15'),
      sueldoBasico: -100,
      categoriaConvenio: 'Administrativo A',
    })).toThrow('El sueldo debe ser mayor a 0');
  });

  it('should reject future fechaIngreso', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    expect(() => Empleado.create({
      clienteId: 'c1',
      estudioId: 'e1',
      nombre: 'Juan',
      apellido: 'Perez',
      cuil: '20-12345678-6',
      fechaIngreso: futureDate,
      sueldoBasico: 500000,
      categoriaConvenio: 'Administrativo A',
    })).toThrow('La fecha de ingreso no puede ser futura');
  });

  it('should expose all getters', () => {
    const emp = createEmpleado();
    expect(emp.clienteId).toBe('c1');
    expect(emp.estudioId).toBe('e1');
    expect(emp.nombre).toBe('Juan');
    expect(emp.apellido).toBe('Perez');
    expect(emp.cuil).toBe('20-12345678-6');
    expect(emp.fechaIngreso).toEqual(new Date('2024-01-15'));
    expect(emp.fechaEgreso).toBeUndefined();
    expect(emp.sueldoBasico).toBe(500000);
    expect(emp.categoriaConvenio).toBe('Administrativo A');
    expect(emp.isActive).toBe(true);
  });

  describe('reconstitute', () => {
    it('should preserve all fields including persisted state', () => {
      const fechaEgreso = new Date('2026-02-28');
      const emp = Empleado.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          nombre: 'Maria',
          apellido: 'Garcia',
          cuil: '27-98765432-1',
          fechaIngreso: new Date('2020-06-01'),
          sueldoBasico: 800000,
          categoriaConvenio: 'Profesional B',
          isActive: false,
          fechaEgreso,
        },
        'existing-id',
      );

      expect(emp.id).toBe('existing-id');
      expect(emp.clienteId).toBe('c1');
      expect(emp.estudioId).toBe('e1');
      expect(emp.nombre).toBe('Maria');
      expect(emp.apellido).toBe('Garcia');
      expect(emp.cuil).toBe('27-98765432-1');
      expect(emp.fechaIngreso).toEqual(new Date('2020-06-01'));
      expect(emp.sueldoBasico).toBe(800000);
      expect(emp.categoriaConvenio).toBe('Profesional B');
      expect(emp.isActive).toBe(false);
      expect(emp.fechaEgreso).toBe(fechaEgreso);
    });

    it('should not emit domain events on reconstitute', () => {
      const emp = Empleado.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          nombre: 'Juan',
          apellido: 'Perez',
          cuil: '20-12345678-6',
          fechaIngreso: new Date('2024-01-15'),
          sueldoBasico: 500000,
          categoriaConvenio: 'Administrativo A',
          isActive: true,
        },
        'id-1',
      );

      expect(emp.getDomainEvents()).toHaveLength(0);
    });

    it('should bypass creation invariants', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      expect(() =>
        Empleado.reconstitute(
          {
            clienteId: 'c1',
            estudioId: 'e1',
            nombre: 'Test',
            apellido: 'Test',
            cuil: '20-00000000-0',
            fechaIngreso: futureDate,
            sueldoBasico: 0,
            categoriaConvenio: 'Test',
            isActive: true,
          },
          'id-1',
        ),
      ).not.toThrow();
    });

    it('should allow domain operations on reconstituted entities', () => {
      const emp = Empleado.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          nombre: 'Juan',
          apellido: 'Perez',
          cuil: '20-12345678-6',
          fechaIngreso: new Date('2024-01-15'),
          sueldoBasico: 500000,
          categoriaConvenio: 'Administrativo A',
          isActive: true,
        },
        'id-1',
      );

      emp.actualizarSueldo(600000);
      expect(emp.sueldoBasico).toBe(600000);

      emp.darDeBaja(new Date('2026-03-31'));
      expect(emp.isActive).toBe(false);
    });
  });
});
