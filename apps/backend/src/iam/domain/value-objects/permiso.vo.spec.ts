import { Permiso, PERMISOS_POR_ROL } from './permiso.vo';
import { ROL } from '@numerito/shared';

describe('Permiso Value Object', () => {
  describe('PERMISOS_POR_ROL', () => {
    it('SOCIO should have all permissions', () => {
      const permisos = PERMISOS_POR_ROL[ROL.SOCIO];
      expect(permisos).toContain(Permiso.GESTIONAR_USUARIOS);
      expect(permisos).toContain(Permiso.GESTIONAR_CLIENTES);
      expect(permisos).toContain(Permiso.GESTIONAR_OBLIGACIONES);
      expect(permisos).toContain(Permiso.VER_FACTURACION);
      expect(permisos).toContain(Permiso.GESTIONAR_CONFIGURACION);
    });

    it('RESPONSABLE should have portfolio permissions', () => {
      const permisos = PERMISOS_POR_ROL[ROL.RESPONSABLE];
      expect(permisos).toContain(Permiso.GESTIONAR_CLIENTES);
      expect(permisos).toContain(Permiso.GESTIONAR_OBLIGACIONES);
      expect(permisos).not.toContain(Permiso.GESTIONAR_USUARIOS);
      expect(permisos).not.toContain(Permiso.GESTIONAR_CONFIGURACION);
    });

    it('EMPLEADO should have limited permissions', () => {
      const permisos = PERMISOS_POR_ROL[ROL.EMPLEADO];
      expect(permisos).toContain(Permiso.VER_CLIENTES);
      expect(permisos).toContain(Permiso.VER_OBLIGACIONES);
      expect(permisos).not.toContain(Permiso.GESTIONAR_USUARIOS);
    });

    it('CLIENTE should only see own data', () => {
      const permisos = PERMISOS_POR_ROL[ROL.CLIENTE];
      expect(permisos).toContain(Permiso.VER_PROPIOS_DATOS);
      expect(permisos).toContain(Permiso.VER_PROPIOS_DOCUMENTOS);
      expect(permisos).not.toContain(Permiso.GESTIONAR_CLIENTES);
      expect(permisos).not.toContain(Permiso.GESTIONAR_USUARIOS);
    });
  });

  describe('hasPermiso', () => {
    it('should return true for valid permission', () => {
      const permisos = PERMISOS_POR_ROL[ROL.SOCIO];
      expect(permisos.includes(Permiso.GESTIONAR_USUARIOS)).toBe(true);
    });

    it('should return false for invalid permission', () => {
      const permisos = PERMISOS_POR_ROL[ROL.CLIENTE];
      expect(permisos.includes(Permiso.GESTIONAR_USUARIOS)).toBe(false);
    });
  });
});
