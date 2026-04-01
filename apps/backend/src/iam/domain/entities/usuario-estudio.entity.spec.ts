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
});
