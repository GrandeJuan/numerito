import { UsuarioEstudio } from './usuario-estudio.entity';
import { ROL } from '@numerito/shared';

describe('UsuarioEstudio Entity', () => {
  it('should create a membership with usuario, estudio and rol', () => {
    const membership = UsuarioEstudio.create({
      usuarioId: 'user-1',
      estudioId: 'estudio-1',
      rol: ROL.SOCIO,
    });

    expect(membership.id).toBeDefined();
    expect(membership.usuarioId).toBe('user-1');
    expect(membership.estudioId).toBe('estudio-1');
    expect(membership.rol).toBe(ROL.SOCIO);
    expect(membership.isActive).toBe(true);
  });

  it('should change rol within a studio', () => {
    const membership = UsuarioEstudio.create({
      usuarioId: 'user-1',
      estudioId: 'estudio-1',
      rol: ROL.EMPLEADO,
    });

    membership.changeRol(ROL.RESPONSABLE);
    expect(membership.rol).toBe(ROL.RESPONSABLE);
  });

  it('should deactivate membership', () => {
    const membership = UsuarioEstudio.create({
      usuarioId: 'user-1',
      estudioId: 'estudio-1',
      rol: ROL.SOCIO,
    });

    membership.deactivate();
    expect(membership.isActive).toBe(false);
  });

  describe('reconstitute', () => {
    it('should reconstitute preserving all fields', () => {
      const membership = UsuarioEstudio.reconstitute({
        usuarioId: 'user-1',
        estudioId: 'estudio-1',
        rol: ROL.RESPONSABLE,
        isActive: false,
      }, 'existing-id');

      expect(membership.id).toBe('existing-id');
      expect(membership.usuarioId).toBe('user-1');
      expect(membership.estudioId).toBe('estudio-1');
      expect(membership.rol).toBe(ROL.RESPONSABLE);
      expect(membership.isActive).toBe(false);
    });

    it('should not emit domain events on reconstitution', () => {
      const membership = UsuarioEstudio.reconstitute({
        usuarioId: 'user-1',
        estudioId: 'estudio-1',
        rol: ROL.SOCIO,
        isActive: true,
      }, 'some-id');

      expect(membership.getDomainEvents()).toHaveLength(0);
    });

    it('should allow domain operations on reconstituted entities', () => {
      const membership = UsuarioEstudio.reconstitute({
        usuarioId: 'user-1',
        estudioId: 'estudio-1',
        rol: ROL.EMPLEADO,
        isActive: true,
      }, 'some-id');

      membership.changeRol(ROL.SOCIO);
      expect(membership.rol).toBe(ROL.SOCIO);
    });
  });

  it('should activate membership after deactivation', () => {
    const membership = UsuarioEstudio.create({
      usuarioId: 'user-1',
      estudioId: 'estudio-1',
      rol: ROL.SOCIO,
    });

    membership.deactivate();
    expect(membership.isActive).toBe(false);
    membership.activate();
    expect(membership.isActive).toBe(true);
  });
});
