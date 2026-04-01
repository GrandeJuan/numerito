import { ROLES_KEY, Roles } from './roles.decorator';
import { ROL } from '@numerito/shared';

describe('Roles decorator', () => {
  it('should set ROLES_KEY metadata with provided roles', () => {
    @Roles(ROL.SOCIO, ROL.RESPONSABLE)
    class TestHandler {}

    const roles = Reflect.getMetadata(ROLES_KEY, TestHandler);
    expect(roles).toEqual([ROL.SOCIO, ROL.RESPONSABLE]);
  });

  it('should export ROLES_KEY as "roles"', () => {
    expect(ROLES_KEY).toBe('roles');
  });

  it('should handle single role', () => {
    @Roles(ROL.CLIENTE)
    class TestHandler {}

    const roles = Reflect.getMetadata(ROLES_KEY, TestHandler);
    expect(roles).toEqual([ROL.CLIENTE]);
  });
});
